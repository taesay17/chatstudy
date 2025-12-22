package com.substring.chat.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:5176"})
public class FileUploadController {

    private final String uploadDir = "uploads";

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws Exception {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");

        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf(".");
        if (dot >= 0) ext = original.substring(dot);

        String filename = UUID.randomUUID() + ext;
        Path path = Paths.get(uploadDir, filename);
        Files.write(path, file.getBytes());

        // URL where file will be available
        String url = "http://localhost:8080/uploads/" + filename;

        return ResponseEntity.ok(Map.of("url", url));
    }
}
