package com.discord.app.controller;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.entity.User;
import com.discord.app.repository.UserRepository;
import com.discord.app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(AuthService.toUserDTO(user));
    }

    @PatchMapping("/me")
    @Transactional
    public ResponseEntity<UserDTO> updateProfile(@RequestBody UpdateProfileRequest req,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getDisplayName() != null && !req.getDisplayName().trim().isEmpty()) {
            user.setDisplayName(req.getDisplayName().trim());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().trim().isEmpty() ? null : req.getAvatarUrl().trim());
        }
        if (req.getStatus() != null && !req.getStatus().trim().isEmpty()) {
            String s = req.getStatus().trim().toUpperCase();
            user.setStatus(s);
            user.setOnline(!s.equals("OFFLINE"));

            // Broadcast presence update
            WsMessage ws = new WsMessage();
            ws.setType("PRESENCE");
            ws.setUsername(user.getUsername());
            messagingTemplate.convertAndSend("/topic/presence", ws);
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(AuthService.toUserDTO(updated));
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> listUsers(@RequestParam(required = false) String search,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        List<User> allUsers = userRepository.findAll();
        List<UserDTO> dtos = allUsers.stream()
                .filter(u -> userDetails == null || !u.getEmail().equalsIgnoreCase(userDetails.getUsername())) // exclude current user from list
                .filter(u -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String q = search.trim().toLowerCase();
                    boolean matchUsername = u.getUsername() != null && u.getUsername().toLowerCase().contains(q);
                    boolean matchDisplay = u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(q);
                    return matchUsername || matchDisplay;
                })
                .map(AuthService::toUserDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(AuthService.toUserDTO(user));
    }
}
