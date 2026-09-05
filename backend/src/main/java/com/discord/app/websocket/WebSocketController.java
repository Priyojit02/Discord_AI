package com.discord.app.websocket;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.entity.User;
import com.discord.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/channel/{channelId}/typing")
    @SendTo("/topic/channel/{channelId}/typing")
    public WsMessage typing(@DestinationVariable Long channelId, WsMessage message, Principal principal) {
        message.setType("TYPING");
        String name = "Someone";
        if (principal != null) {
            name = userRepository.findByEmail(principal.getName())
                    .map(u -> u.getDisplayName() != null && !u.getDisplayName().isBlank() ? u.getDisplayName() : u.getUsername())
                    .orElse(principal.getName());
        }
        message.setUsername(name);
        message.setChannelId(channelId);
        return message;
    }

    @MessageMapping("/dm/{targetId}/typing")
    public void dmTyping(@DestinationVariable String targetId, WsMessage message, Principal principal) {
        if (principal == null) return;
        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        String senderName = sender != null ? (sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername()) : principal.getName();

        message.setType("TYPING");
        message.setUsername(senderName);

        String recipientEmail = targetId;
        try {
            Long targetUserId = Long.parseLong(targetId);
            recipientEmail = userRepository.findById(targetUserId).map(User::getEmail).orElse(targetId);
        } catch (NumberFormatException ignored) {}

        messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/dm/typing", message);
    }

    @MessageMapping("/call/{targetId}/signal")
    public void callSignal(@DestinationVariable String targetId, java.util.Map<String, Object> signal, Principal principal) {
        if (principal == null) return;
        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        if (sender != null) {
            signal.put("fromUserId", sender.getId());
            signal.put("fromUsername", sender.getDisplayName() != null && !sender.getDisplayName().isBlank() ? sender.getDisplayName() : sender.getUsername());
            signal.put("fromAvatarUrl", sender.getAvatarUrl());
        }

        String recipientEmail = targetId;
        try {
            Long targetUserId = Long.parseLong(targetId);
            recipientEmail = userRepository.findById(targetUserId).map(User::getEmail).orElse(targetId);
        } catch (NumberFormatException ignored) {}

        messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/call/signal", signal);
    }

    @MessageMapping("/voice-channel/{channelId}/signal")
    @SendTo("/topic/voice-channel/{channelId}/signal")
    public java.util.Map<String, Object> voiceChannelSignal(@DestinationVariable Long channelId, java.util.Map<String, Object> signal, Principal principal) {
        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(sender -> {
                signal.put("fromUserId", sender.getId());
                signal.put("fromUsername", sender.getDisplayName() != null && !sender.getDisplayName().isBlank() ? sender.getDisplayName() : sender.getUsername());
                signal.put("fromAvatarUrl", sender.getAvatarUrl());
            });
        }
        signal.put("channelId", channelId);
        return signal;
    }

    @MessageMapping("/presence")
    public void presence(WsMessage message, Principal principal) {
        if (principal == null) return;
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user != null) {
            message.setType("PRESENCE");
            message.setUsername(user.getUsername());
            messagingTemplate.convertAndSend("/topic/presence", message);
        }
    }
}

