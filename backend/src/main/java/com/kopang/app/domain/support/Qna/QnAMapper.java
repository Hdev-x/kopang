package com.kopang.app.domain.support.Qna;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QnAMapper {

    List<QnADTO> findAll();

    List<QnADTO> findByType(@Param("type") String type);

    QnADTO findById(Long id);

    void insertQna(QnADTO qna);

    void answerQna(@Param("id") Long id, @Param("answerContent") String answerContent);

}
