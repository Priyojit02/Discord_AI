package com.discord.app.controller;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.service.ServerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;

    @PostMapping
    public ResponseEntity<ServerDTO> create(@Valid @RequestBody CreateServerRequest req,
                                            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(serverService.createServer(req, user.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<ServerDTO>> getMyServers(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(serverService.getUserServers(user.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServerDTO> getServer(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.getServer(id));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserDTO>> getServerMembers(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.getServerMembers(id));
    }

    @GetMapping("/invite/{inviteCode}")
    public ResponseEntity<ServerDTO> getServerByInvite(@PathVariable String inviteCode) {
        return ResponseEntity.ok(serverService.getServerByInvite(inviteCode));
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<ServerDTO> join(@PathVariable String inviteCode,
                                          @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(serverService.joinByInvite(inviteCode, user.getUsername()));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable Long id,
                                      @AuthenticationPrincipal UserDetails user) {
        serverService.leaveServer(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteServer(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails user) {
        serverService.deleteServer(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
