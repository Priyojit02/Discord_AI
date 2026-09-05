package com.discord.app.service;

import com.discord.app.dto.AppDTOs.*;
import com.discord.app.entity.Channel;
import com.discord.app.entity.Server;
import com.discord.app.entity.User;
import com.discord.app.repository.ServerRepository;
import com.discord.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServerService {

    private final ServerRepository serverRepository;
    private final UserRepository userRepository;

    @Transactional
    public ServerDTO createServer(CreateServerRequest req, String email) {
        User owner = userRepository.findByEmail(email).orElseThrow();

        Channel general = Channel.builder()
                .name("general")
                .type(Channel.ChannelType.TEXT)
                .build();

        Channel generalVoice = Channel.builder()
                .name("General Voice")
                .type(Channel.ChannelType.VOICE)
                .build();

        Server server = Server.builder()
                .name(req.getName())
                .description(req.getDescription())
                .inviteCode(UUID.randomUUID().toString().substring(0, 8))
                .owner(owner)
                .build();

        server.getMembers().add(owner);
        general.setServer(server);
        generalVoice.setServer(server);
        server.getChannels().add(general);
        server.getChannels().add(generalVoice);

        return toDTO(serverRepository.save(server));
    }

    public List<ServerDTO> getUserServers(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return serverRepository.findAllByMemberId(user.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ServerDTO getServer(Long id) {
        return toDTO(serverRepository.findById(id).orElseThrow());
    }

    public ServerDTO getServerByInvite(String inviteCode) {
        Server server = serverRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));
        return toDTO(server);
    }

    @Transactional
    public ServerDTO joinByInvite(String inviteCode, String email) {
        Server server = serverRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));
        User user = userRepository.findByEmail(email).orElseThrow();
        server.getMembers().add(user);
        return toDTO(serverRepository.save(server));
    }

    @Transactional
    public void leaveServer(Long serverId, String email) {
        Server server = serverRepository.findById(serverId).orElseThrow();
        User user = userRepository.findByEmail(email).orElseThrow();
        server.getMembers().remove(user);
        serverRepository.save(server);
    }

    @Transactional
    public void deleteServer(Long serverId, String email) {
        Server server = serverRepository.findById(serverId).orElseThrow();
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only the server owner can delete this server");
        }
        serverRepository.delete(server);
    }

    public List<UserDTO> getServerMembers(Long serverId) {
        Server server = serverRepository.findById(serverId).orElseThrow();
        return server.getMembers().stream()
                .map(AuthService::toUserDTO)
                .collect(Collectors.toList());
    }

    public ServerDTO toDTO(Server server) {
        ServerDTO dto = new ServerDTO();
        dto.setId(server.getId());
        dto.setName(server.getName());
        dto.setDescription(server.getDescription());
        dto.setIconUrl(server.getIconUrl());
        dto.setInviteCode(server.getInviteCode());
        dto.setOwner(AuthService.toUserDTO(server.getOwner()));
        dto.setMemberCount(server.getMembers().size());
        dto.setMembers(server.getMembers().stream().map(AuthService::toUserDTO).collect(Collectors.toList()));
        dto.setCreatedAt(server.getCreatedAt());
        dto.setChannels(server.getChannels().stream().map(c -> {
            ChannelDTO cdto = new ChannelDTO();
            cdto.setId(c.getId());
            cdto.setName(c.getName());
            cdto.setType(c.getType().name());
            cdto.setDescription(c.getDescription());
            cdto.setServerId(server.getId());
            cdto.setCreatedAt(c.getCreatedAt());
            return cdto;
        }).collect(Collectors.toList()));
        return dto;
    }
}
