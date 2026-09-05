package com.discord.app.service;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.entity.Channel;
import com.discord.app.entity.Server;
import com.discord.app.repository.ChannelRepository;
import com.discord.app.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final ServerRepository serverRepository;

    public ChannelDTO createChannel(Long serverId, CreateChannelRequest req) {
        Server server = serverRepository.findById(serverId).orElseThrow();
        Channel channel = Channel.builder()
                .name(req.getName())
                .type(req.getType())
                .description(req.getDescription())
                .server(server)
                .build();
        return toDTO(channelRepository.save(channel));
    }

    public List<ChannelDTO> getChannels(Long serverId) {
        return channelRepository.findByServerId(serverId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void deleteChannel(Long channelId) {
        channelRepository.deleteById(channelId);
    }

    public ChannelDTO toDTO(Channel c) {
        ChannelDTO dto = new ChannelDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setType(c.getType().name());
        dto.setDescription(c.getDescription());
        dto.setServerId(c.getServer().getId());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
