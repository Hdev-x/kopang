package com.kopang.app.domain.product;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

    @Value("${cloud.aws.credentials.access-key}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;

    @Value("${cloud.aws.region}")
    private String region;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.s3.image-base-url}")
    private String imageBaseUrl;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }

    public String uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 비어 있습니다.");
        }

        // 고유 파일 이름 생성 (UUID)
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String s3Key = "product-images/" + UUID.randomUUID().toString() + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .build();

            // S3 업로드 실행
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // 업로드 완료된 S3 public URL 반환
            return imageBaseUrl + "/" + s3Key;

        } catch (IOException e) {
            throw new RuntimeException("S3 파일 업로드 중 입출력 오류가 발생했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("AWS S3 업로드 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * S3에서 파일 삭제
     *
     * @param fileUrl 삭제할 이미지의 전체 public URL
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.trim().isEmpty()) {
            return;
        }

        // S3 URL 형식 검사 및 s3Key 추출
        if (!fileUrl.contains(imageBaseUrl)) {
            log.warn("삭제 대상 파일 URL이 현재 S3 버킷 베이스 경로와 일치하지 않습니다. URL: {}", fileUrl);
            return;
        }

        try {
            // "https://bucket-name.s3.region.amazonaws.com/product-images/uuid.jpg" -> "product-images/uuid.jpg"
            String s3Key = fileUrl.substring(imageBaseUrl.length());
            if (s3Key.startsWith("/")) {
                s3Key = s3Key.substring(1);
            }

            log.info("S3 객체 삭제 요청 - key: {}", s3Key);

            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("S3 객체 삭제 완료 - key: {}", s3Key);

        } catch (Exception e) {
            // S3 삭제 실패가 상품 CRUD 비즈니스 동작 자체를 실패시키지 않도록 로깅 후 예외를 잡아둠
            log.error("AWS S3 파일 삭제 시도 중 오류가 발생했습니다: {}", e.getMessage(), e);
        }
    }
}
