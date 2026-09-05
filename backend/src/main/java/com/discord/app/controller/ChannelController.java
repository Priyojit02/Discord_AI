package com.discord.app.controller;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servers/{serverId}/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping
    public ResponseEntity<ChannelDTO> create(@PathVariable Long serverId,
                                             @Valid @RequestBody CreateChannelRequest req) {
        return ResponseEntity.ok(channelService.createChannel(serverId, req));
    }

    @GetMapping
    public ResponseEntity<List<ChannelDTO>> getChannels(@PathVariable Long serverId) {
        return ResponseEntity.ok(channelService.getChannels(serverId));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> delete(@PathVariable Long serverId, @PathVariable Long channelId) {
        channelService.deleteChannel(channelId);
        return ResponseEntity.noContent().build();
    }
}
