package com.kopang.app.domain.support.notice;
import java.time.LocalDateTime;
import lombok.Data;


@Data
public class NoticeDTO {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    

}