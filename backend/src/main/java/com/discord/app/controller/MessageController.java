package com.discord.app.controller;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/channels/{channelId}/messages")
    public ResponseEntity<MessageDTO> sendToChannel(@PathVariable Long channelId,
                                                    @RequestBody SendMessageRequest req,
                                                    @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(messageService.sendChannelMessage(channelId, req, user.getUsername()));
    }

    @GetMapping("/channels/{channelId}/messages")
    public ResponseEntity<List<MessageDTO>> getChannelMessages(@PathVariable Long channelId,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @AuthenticationPrincipal UserDetails user) {
        String email = user != null ? user.getUsername() : null;
        return ResponseEntity.ok(messageService.getChannelMessages(channelId, email, page));
    }

    @PostMapping("/dm/{receiverId}/messages")
    public ResponseEntity<MessageDTO> sendDM(@PathVariable Long receiverId,
                                             @RequestBody SendMessageRequest req,
                                             @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(messageService.sendDirectMessage(receiverId, req, user.getUsername()));
    }

    @GetMapping("/dm/{dmId}/messages")
    public ResponseEntity<List<MessageDTO>> getDMMessages(@PathVariable Long dmId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @AuthenticationPrincipal UserDetails user) {
        String email = user != null ? user.getUsername() : null;
        return ResponseEntity.ok(messageService.getDMMessages(dmId, email, page));
    }

    @GetMapping("/dm/user/{userId}/messages")
    public ResponseEntity<List<MessageDTO>> getDMMessagesBetweenUsers(@PathVariable Long userId,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(messageService.getDMMessagesBetweenUsers(userId, user.getUsername(), page));
    }

    @GetMapping("/dm")
    public ResponseEntity<List<DirectMessageDTO>> getConversations(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(messageService.getUserConversations(user.getUsername()));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<MessageDTO> editMessage(@PathVariable Long messageId,
                                                  @RequestBody Map<String, String> body,
                                                  @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(messageService.editMessage(messageId, body.get("content"), user.getUsername()));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId,
                                              @AuthenticationPrincipal UserDetails user) {
        messageService.deleteMessage(messageId, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<List<ReactionDTO>> toggleReaction(@PathVariable Long messageId,
                                                            @Valid @RequestBody ToggleReactionRequest req,
                                                            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(messageService.toggleReaction(messageId, req.getEmoji(), user.getUsername()));
    }
}
