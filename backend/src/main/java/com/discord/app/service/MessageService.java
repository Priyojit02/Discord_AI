package com.discord.app.service;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.entity.Channel;
import com.discord.app.entity.DirectMessage;
import com.discord.app.entity.Message;
import com.discord.app.entity.Reaction;
import com.discord.app.entity.User;
import com.discord.app.repository.ChannelRepository;
import com.discord.app.repository.DirectMessageRepository;
import com.discord.app.repository.MessageRepository;
import com.discord.app.repository.ReactionRepository;
import com.discord.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final DirectMessageRepository dmRepository;
    private final ReactionRepository reactionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageDTO sendChannelMessage(Long channelId, SendMessageRequest req, String email) {
        User sender = userRepository.findByEmail(email).orElseThrow();
        Channel channel = channelRepository.findById(channelId).orElseThrow();

        Message message = Message.builder()
                .content(req.getContent())
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .sender(sender)
                .channel(channel)
                .build();

        Message saved = messageRepository.save(message);
        MessageDTO dto = toDTO(saved, email);

        WsMessage ws = new WsMessage();
        ws.setType("CHAT");
        ws.setMessage(dto);
        ws.setChannelId(channelId);
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, ws);

        return dto;
    }

    @Transactional
    public MessageDTO sendDirectMessage(Long receiverId, SendMessageRequest req, String email) {
        User sender = userRepository.findByEmail(email).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        DirectMessage dm = dmRepository.findConversation(sender.getId(), receiver.getId())
                .orElseGet(() -> dmRepository.save(DirectMessage.builder()
                        .sender(sender).receiver(receiver).build()));

        Message message = Message.builder()
                .content(req.getContent())
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .sender(sender)
                .directMessage(dm)
                .build();

        Message saved = messageRepository.save(message);
        MessageDTO dto = toDTO(saved, email);

        WsMessage ws = new WsMessage();
        ws.setType("CHAT");
        ws.setMessage(dto);
        ws.setDmId(dm.getId());
        // Send to both receiver and sender (so all sessions stay synced)
        messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/dm", ws);
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/dm", ws);

        return dto;
    }

    public List<MessageDTO> getChannelMessages(Long channelId, String email, int page) {
        Page<Message> messages = messageRepository
                .findByChannelIdOrderByCreatedAtDesc(channelId, PageRequest.of(page, 50));
        return messages.getContent().stream().map(m -> toDTO(m, email)).collect(Collectors.toList());
    }

    public List<MessageDTO> getDMMessages(Long dmId, String email, int page) {
        Page<Message> messages = messageRepository
                .findByDirectMessageIdOrderByCreatedAtDesc(dmId, PageRequest.of(page, 50));
        return messages.getContent().stream().map(m -> toDTO(m, email)).collect(Collectors.toList());
    }

    public List<MessageDTO> getDMMessagesBetweenUsers(Long otherUserId, String email, int page) {
        User me = userRepository.findByEmail(email).orElseThrow();
        return dmRepository.findConversation(me.getId(), otherUserId)
                .map(dm -> getDMMessages(dm.getId(), email, page))
                .orElse(Collections.emptyList());
    }

    public List<DirectMessageDTO> getUserConversations(String email) {
        User me = userRepository.findByEmail(email).orElseThrow();
        List<DirectMessage> dms = dmRepository.findAllByUserId(me.getId());
        return dms.stream().map(dm -> {
            DirectMessageDTO dto = new DirectMessageDTO();
            dto.setId(dm.getId());
            User other = dm.getSender().getId().equals(me.getId()) ? dm.getReceiver() : dm.getSender();
            dto.setOtherUser(AuthService.toUserDTO(other));

            Page<Message> lastMsgs = messageRepository.findByDirectMessageIdOrderByCreatedAtDesc(dm.getId(), PageRequest.of(0, 1));
            if (!lastMsgs.isEmpty()) {
                dto.setLastMessage(toDTO(lastMsgs.getContent().get(0), email));
                dto.setUpdatedAt(lastMsgs.getContent().get(0).getCreatedAt());
            } else {
                dto.setUpdatedAt(dm.getCreatedAt());
            }
            return dto;
        }).sorted((a, b) -> {
            if (a.getUpdatedAt() == null) return 1;
            if (b.getUpdatedAt() == null) return -1;
            return b.getUpdatedAt().compareTo(a.getUpdatedAt());
        }).collect(Collectors.toList());
    }

    @Transactional
    public MessageDTO editMessage(Long messageId, String content, String email) {
        Message message = messageRepository.findById(messageId).orElseThrow();
        if (!message.getSender().getEmail().equals(email))
            throw new RuntimeException("Unauthorized");
        message.setContent(content);
        message.setEdited(true);
        MessageDTO dto = toDTO(messageRepository.save(message), email);

        WsMessage ws = new WsMessage();
        ws.setType("MESSAGE_EDIT");
        ws.setMessage(dto);
        ws.setMessageId(message.getId());
        if (message.getChannel() != null) {
            ws.setChannelId(message.getChannel().getId());
            messagingTemplate.convertAndSend("/topic/channel/" + message.getChannel().getId(), ws);
        } else if (message.getDirectMessage() != null) {
            ws.setDmId(message.getDirectMessage().getId());
            DirectMessage dm = message.getDirectMessage();
            messagingTemplate.convertAndSendToUser(dm.getSender().getEmail(), "/queue/dm", ws);
            messagingTemplate.convertAndSendToUser(dm.getReceiver().getEmail(), "/queue/dm", ws);
        }

        return dto;
    }

    @Transactional
    public void deleteMessage(Long messageId, String email) {
        Message message = messageRepository.findById(messageId).orElseThrow();
        if (!message.getSender().getEmail().equals(email))
            throw new RuntimeException("Unauthorized");
        message.setDeleted(true);
        message.setContent("This message was deleted");
        messageRepository.save(message);

        MessageDTO dto = toDTO(message, email);
        WsMessage ws = new WsMessage();
        ws.setType("MESSAGE_DELETE");
        ws.setMessage(dto);
        ws.setMessageId(messageId);
        if (message.getChannel() != null) {
            ws.setChannelId(message.getChannel().getId());
            messagingTemplate.convertAndSend("/topic/channel/" + message.getChannel().getId(), ws);
        } else if (message.getDirectMessage() != null) {
            ws.setDmId(message.getDirectMessage().getId());
            DirectMessage dm = message.getDirectMessage();
            messagingTemplate.convertAndSendToUser(dm.getSender().getEmail(), "/queue/dm", ws);
            messagingTemplate.convertAndSendToUser(dm.getReceiver().getEmail(), "/queue/dm", ws);
        }
    }

    @Transactional
    public List<ReactionDTO> toggleReaction(Long messageId, String emoji, String email) {
        Message message = messageRepository.findById(messageId).orElseThrow();
        User user = userRepository.findByEmail(email).orElseThrow();

        Optional<Reaction> existing = reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, user.getId(), emoji);
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
        } else {
            reactionRepository.save(Reaction.builder()
                    .message(message)
                    .user(user)
                    .emoji(emoji)
                    .build());
        }

        List<ReactionDTO> reactionDTOs = getReactionsForMessage(messageId, email);

        WsMessage ws = new WsMessage();
        ws.setType("REACTION");
        ws.setMessageId(messageId);
        ws.setReactionEmoji(emoji);
        ws.setUsername(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
        ws.setReactions(reactionDTOs);

        if (message.getChannel() != null) {
            ws.setChannelId(message.getChannel().getId());
            messagingTemplate.convertAndSend("/topic/channel/" + message.getChannel().getId(), ws);
        } else if (message.getDirectMessage() != null) {
            ws.setDmId(message.getDirectMessage().getId());
            DirectMessage dm = message.getDirectMessage();
            messagingTemplate.convertAndSendToUser(dm.getSender().getEmail(), "/queue/dm", ws);
            messagingTemplate.convertAndSendToUser(dm.getReceiver().getEmail(), "/queue/dm", ws);
        }

        return reactionDTOs;
    }

    public List<ReactionDTO> getReactionsForMessage(Long messageId, String currentUserEmail) {
        List<Reaction> reactions = reactionRepository.findByMessageId(messageId);
        Map<String, List<Reaction>> byEmoji = reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getEmoji));

        return byEmoji.entrySet().stream().map(entry -> {
            ReactionDTO rdto = new ReactionDTO();
            rdto.setEmoji(entry.getKey());
            rdto.setCount(entry.getValue().size());
            rdto.setUsernames(entry.getValue().stream()
                    .map(r -> r.getUser().getDisplayName() != null && !r.getUser().getDisplayName().isBlank()
                            ? r.getUser().getDisplayName() : r.getUser().getUsername())
                    .collect(Collectors.toList()));
            rdto.setReactedByMe(currentUserEmail != null && entry.getValue().stream()
                    .anyMatch(r -> r.getUser().getEmail().equalsIgnoreCase(currentUserEmail)));
            return rdto;
        }).collect(Collectors.toList());
    }

    public MessageDTO toDTO(Message m) {
        return toDTO(m, null);
    }

    public MessageDTO toDTO(Message m, String currentUserEmail) {
        MessageDTO dto = new MessageDTO();
        dto.setId(m.getId());
        dto.setContent(m.isDeleted() ? "This message was deleted" : m.getContent());
        dto.setFileUrl(m.getFileUrl());
        dto.setFileName(m.getFileName());
        dto.setEdited(m.isEdited());
        dto.setDeleted(m.isDeleted());
        dto.setSender(AuthService.toUserDTO(m.getSender()));
        dto.setChannelId(m.getChannel() != null ? m.getChannel().getId() : null);
        dto.setDirectMessageId(m.getDirectMessage() != null ? m.getDirectMessage().getId() : null);
        dto.setCreatedAt(m.getCreatedAt());
        dto.setUpdatedAt(m.getUpdatedAt());
        dto.setReactions(getReactionsForMessage(m.getId(), currentUserEmail));
        return dto;
    }
}
