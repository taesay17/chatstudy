package com.substring.chat.controllers;

import com.substring.chat.entities.Role;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.substring.chat.playload.AuthRequest;


import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("http://localhost:*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder encoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        String r = (req.getRole() == null) ? "STUDENT" : req.getRole().toUpperCase();
        Role role = Role.valueOf(r); // STUDENT/TEACHER

        User user = new User(req.getUsername(), encoder.encode(req.getPassword()), role);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole().name()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        User user = userRepository.findByUsername(req.getUsername()).orElse(null);
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole().name()
        ));
    }
}
