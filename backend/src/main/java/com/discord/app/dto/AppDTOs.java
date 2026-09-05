package com.discord.app.dto;

import com.discord.app.entity.Channel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class AppDTOs {

    // ---- Auth ----
    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 20)
        private String username;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
        private String displayName;
    }

    @Data
    public static class LoginRequest {
        @NotBlank private String email;
        @NotBlank private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private UserDTO user;
    }

    // ---- User ----
    @Data
    public static class UserDTO {
        private Long id;
        private String username;
        private String email;
        private String displayName;
        private String avatarUrl;
        private String status;
        private boolean online;
    }

    // ---- Server ----
    @Data
    public static class CreateServerRequest {
        @NotBlank private String name;
        private String description;
    }

    @Data
    public static class ServerDTO {
        private Long id;
        private String name;
        private String description;
        private String iconUrl;
        private String inviteCode;
        private UserDTO owner;
        private List<ChannelDTO> channels;
        private List<UserDTO> members;
        private int memberCount;
        private LocalDateTime createdAt;
    }

    // ---- Channel ----
    @Data
    public static class CreateChannelRequest {
        @NotBlank private String name;
        private Channel.ChannelType type = Channel.ChannelType.TEXT;
        private String description;
    }

    @Data
    public static class ChannelDTO {
        private Long id;
        private String name;
        private String type;
        private String description;
        private Long serverId;
        private LocalDateTime createdAt;
    }

    // ---- Reaction ----
    @Data
    public static class ReactionDTO {
        private String emoji;
        private int count;
        private List<String> usernames;
        private boolean reactedByMe;
    }

    @Data
    public static class ToggleReactionRequest {
        @NotBlank
        private String emoji;
    }

    // ---- Profile ----
    @Data
    public static class UpdateProfileRequest {
        private String displayName;
        private String avatarUrl;
        private String status; // ONLINE, IDLE, DND, OFFLINE
    }

    // ---- Message ----
    @Data
    public static class SendMessageRequest {
        private String content;
        private String fileUrl;
        private String fileName;
    }

    @Data
    public static class MessageDTO {
        private Long id;
        private String content;
        private String fileUrl;
        private String fileName;
        private boolean edited;
        private boolean deleted;
        private UserDTO sender;
        private Long channelId;
        private Long directMessageId;
        private List<ReactionDTO> reactions = new java.util.ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ---- Direct Message Conversation ----
    @Data
    public static class DirectMessageDTO {
        private Long id;
        private UserDTO otherUser;
        private MessageDTO lastMessage;
        private LocalDateTime updatedAt;
    }

    // ---- WebSocket ----
    @Data
    public static class WsMessage {
        private String type; // CHAT, TYPING, PRESENCE, MESSAGE_EDIT, MESSAGE_DELETE, REACTION
        private MessageDTO message;
        private Long channelId;
        private Long dmId;
        private String username;
        private boolean typing;
        private Long messageId;
        private String reactionEmoji;
        private List<ReactionDTO> reactions;
    }
}

