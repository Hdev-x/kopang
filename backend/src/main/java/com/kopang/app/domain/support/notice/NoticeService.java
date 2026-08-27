package com.kopang.app.domain.support.notice;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeMapper noticeMapper;

    public List<NoticeDTO> getNoticeList() {
        return noticeMapper.findAll();
    }

    public NoticeDTO getNotice(Long id) {
        NoticeDTO notice = noticeMapper.findById(id);

        if (notice == null) {
            throw new IllegalArgumentException("NOT_FOUND");

        }

        return notice;

    }

}
