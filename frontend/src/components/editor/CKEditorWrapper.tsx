import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { uploadProductImage } from "../../api/products";
import "./CKEditorWrapper.css";

// AWS S3 커스텀 업로드 어댑터
class S3UploadAdapter {
  private loader: any;

  constructor(loader: any) {
    this.loader = loader;
  }

  async upload(): Promise<{ default: string }> {
    const file = await this.loader.file;
    try {
      const s3Url = await uploadProductImage(file);
      return { default: s3Url };
    } catch (error) {
      console.error("CKEditor S3 이미지 업로드 실패:", error);
      throw error;
    }
  }

  abort(): void {
    // 업로드 중단 시 로직
  }
}

// S3 업로드 어댑터 플러그인
function S3UploadAdapterPlugin(editor: any) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
    return new S3UploadAdapter(loader);
  };
}

interface CKEditorWrapperProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

export function CKEditorWrapper({ value, onChange, placeholder }: CKEditorWrapperProps) {
  const editorInstance = (ClassicEditor as any).default || ClassicEditor;

  return (
    <div className="ck-editor-wrapper">
      <CKEditor
        editor={editorInstance}
        data={value}
        config={{
          placeholder: placeholder || "상품 상세 설명을 입력하세요 (텍스트 작성 및 이미지 드래그&드롭/첨부 가능)",
          extraPlugins: [S3UploadAdapterPlugin],
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "|",
            "imageUpload",
            "blockQuote",
            "insertTable",
            "undo",
            "redo",
          ],
        }}
        onChange={(_event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
}
