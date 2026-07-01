package com.kopang.app.global.s3;

import java.util.UUID;

public class S3KeyUtil {
    public static String product(Long id, String ext) { return key("products/" + id, ext); }
    public static String review(Long id, String ext)  { return key("reviews/" + id, ext); }
    public static String userProfile(Long id, String ext) { return key("users/" + id, ext); }

    private static String key(String dir, String ext) {
        return dir + "/" + UUID.randomUUID() + "." + ext;
    }
    public static String ext(String filename) {
        int i = filename == null ? -1 : filename.lastIndexOf('.');
        return i < 0 ? "bin" : filename.substring(i + 1).toLowerCase();
    }
}