# NGUYÊN TẮC THIẾT KẾ & TRÌNH BÀY (MEMORY RULES)

## 1. CẤM TUYỆT ĐỐI CÁC LỖI TYPOGRAPHY TIẾNG VIỆT
### A. Cấm rớt chữ đơn lẻ (Widows / Orphans):
- **Tuyệt đối không để 1 từ hoặc 1 âm tiết đơn lẻ** (ví dụ: "bộ!", "án", "sau!") bị rớt xuống đứng cô độc ở dòng mới.

### B. Cấm chẻ đôi từ ghép tiếng Việt (Splitting Compound Words):
- **Tuyệt đối không để từ ghép bị bẻ đôi sang 2 dòng**:
  - *Ví dụ lỗi nghiêm trọng:* Dòng 1 kết thúc bằng chữ **"thi"**, dòng 2 rớt xuống chữ **"đua bứt phá...)"** -> Bẻ gãy từ ghép "thi đua"!
  - Các cặp từ ghép tiếng Việt bắt buộc phải đi liền khối: `thi&nbsp;đua`, `bứt&nbsp;phá`, `nâng&nbsp;cấp`, `bản&nbsp;làng`, `bảo&nbsp;hộ`, `phát&nbsp;triển`, `đoàn&nbsp;kết`, `tiến&nbsp;bộ`, `đáp&nbsp;án`...

### C. Cấm dòng đuôi cụt lủn (Runts / Dangling Short Lines):
- Không để dòng thứ hai của một đoạn văn chỉ có 2-3 chữ ngắn ngủn tạo thành "cái đuôi" cụt cỡn, mất cân đối thị giác.
- **Quy tắc độ dài câu:** 
  - Ưu tiên câu súc tích để nằm trọn vẹn trên **1 dòng duy nhất** trên màn hình chuẩn.
  - Nếu câu dài buộc phải 2 dòng: phải ngắt dòng cân đối (2 dòng có độ dài xấp xỉ nhau theo vế câu có nghĩa), không để dòng 1 dài ngoằng và dòng 2 chỉ có 1 cụm chữ lẻ loi.

### D. Quy chuẩn kỹ thuật bắt buộc:
1. **HTML & Viết câu:**
   - Dùng `&nbsp;` gắn kết các từ ghép hoặc 2-3 từ cuối câu (ví dụ: `thi&nbsp;đua bứt&nbsp;phá...`, `khang&nbsp;trang`, `dân&nbsp;tộc`).
   - Chủ động ngắt nhịp tự nhiên bằng `<br>` theo đúng ngữ nghĩa nếu câu gồm 2 vế.
   - Với các thẻ nhỏ (như thẻ lộ trình, thẻ kết quả, nhãn cấp độ): nếu tiêu đề gồm nhiều từ, **bắt buộc dùng `<br>` ngắt thành 2 dòng cân đối theo cụm nghĩa** (ví dụ: `Bản làng<br>khang&nbsp;trang`, `Nhà văn hóa<br>các&nbsp;dân&nbsp;tộc`), tuyệt đối không để trình duyệt tự động ngắt làm rớt 1 chữ cuối ("trang", "tộc").
   - Câu ngắn gọn, súc tích, lược bỏ từ rườm rà để không bị tràn dòng cưỡng bức.
2. **CSS Typography:**
   - Luôn áp dụng `text-wrap: balance;` và `word-break: keep-all;` cho tiêu đề, phụ đề, nhãn thẻ nhỏ (`.tp-name`, `.vname`, `.upcard .lbl`).
   - Áp dụng `text-wrap: pretty;` cho các khối văn bản `p, li, .rules`.
   - Độ rộng khung (`max-width`) phải rộng rãi, thoải mái (từ 780px - 880px), không được bóp nghẹt khiến văn bản gãy khúc vô duyên.

### E. Trường hợp thực tế cấm tái diễn:
- **Lỗi rớt chữ và chẻ từ ở thẻ lộ trình cấp độ:**
  - ❌ *Sai:* `Bản làng khang` / `trang` (rớt chữ "trang", chẻ đôi từ ghép "khang trang")
  - ✅ *Đúng:* `Bản làng`<br>`khang&nbsp;trang` (mỗi dòng là 1 cụm từ trọn vẹn)
  - ❌ *Sai:* `Nhà văn hóa các dân` / `tộc` (rớt chữ "tộc", chẻ đôi từ ghép "dân tộc")
  - ✅ *Đúng:* `Nhà văn hóa`<br>`các&nbsp;dân&nbsp;tộc` (dòng 1: Nhà văn hóa, dòng 2: các dân tộc)
  - ❌ *Sai:* `thi` / `đua bứt phá...)` (chẻ đôi từ ghép "thi đua")
  - ✅ *Đúng:* `bứt&nbsp;phá thi&nbsp;đua` (khóa dính từ ghép)
  - ❌ *Sai:* `tiến` / `bộ!` (rớt chữ "bộ!")
  - ✅ *Đúng:* `tiến&nbsp;bộ!` (khóa dính từ cuối)

---

## 2. VĂN PHONG CHUẨN MỰC (ACADEMIC & ELEGANT)
- Giữ văn phong nghiêm túc, học thuật, tôn trọng tinh thần đại đoàn kết các dân tộc (môn MLN131).
- Không dùng các tiền tố giới thiệu rườm rà (như "Hoạt động tương tác thuyết trình:").
- Không dùng từ ngữ mang tính tiêu cực/thù địch (thay "địch/phá/cướp" bằng "đội bạn/thử thách/bứt phá").
