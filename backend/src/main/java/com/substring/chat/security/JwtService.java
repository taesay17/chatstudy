package com.substring.chat.service;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final String SECRET = "CHANGE_ME_TO_LONG_RANDOM_SECRET_32+";
    private final long EXP_MS = 1000L * 60 * 60 * 24; // 24 часа

    public String generateToken(Long userId, String username, String role) {
        return Jwts.builder()
                .setClaims(Map.of("id", userId, "role", role))
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXP_MS))
                .signWith(SignatureAlgorithm.HS256, SECRET.getBytes())
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET.getBytes())
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        Object role = Jwts.parser()
                .setSigningKey(SECRET.getBytes())
                .parseClaimsJws(token)
                .getBody()
                .get("role");
        return role == null ? null : role.toString();
    }
}
