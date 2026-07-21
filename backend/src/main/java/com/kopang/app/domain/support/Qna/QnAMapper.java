package com.kopang.app.domain.support.Qna;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QnAMapper {

        List<QnADTO> findAll(@Param("userId") Long userId);

        List<QnADTO> findByType(
                        @Param("userId") Long userId,
                        @Param("type") String type);

        List<QnADTO> findByProductId(
                        @Param("productId") Long productId);

        QnADTO findById(Long id);

        QnADTO findByIdAndUserId(
                        @Param("id") Long id,
                        @Param("userId") Long userId);

        void insertQna(QnADTO qna);

        void answerQna(@Param("id") Long id, @Param("answerContent") String answerContent);

}
