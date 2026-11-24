# Why We Did It This Way

Eleven decisions, each in two lines. This page is a translation: to change a decision, change it at the machine layer first.

- **D1. 10ms is a language. The framework is only its first host.**
  Why: Platforms and frameworks age. A language made for AI can outlive both.

- **D2. The eight principles never change. Only the human owner may amend them.**
  Why: A compass that moves is not a compass. Agents drift; principles must not.

- **D3. We write for AI first. People get a view, not the source.**
  Why: Serving both makes the code worse for both. AI pays per token; a person can always ask for a translation.

- **D4. A program never names a platform.**
  Why: Hosts are mortal. Moving to a new one must never mean a rewrite.

- **D5. We made 10ms our name and our filter.**
  Why: The number came from a real wall, and a hard limit filters out useless work.

- **D6. We went public under MIT.**
  Why: Hidden means no community. People can copy the code, but not our community, story, trust or speed.

- **D7. The core stays tiny, then freezes.**
  Why: Any AI can read a small core in one go. Once frozen, it only grows by addition and never breaks an old program. The ecosystem grows outside.

- **D8. No rule names a syntax, a version or a vendor.**
  Why: A rule must stay true if today's platforms and models vanish. Syntax lives in the one-page spec; vendors live in the host list.

- **D9. Two layers: the machine layer is the root, the human layer is its translation. The machine layer is in English.**
  Why: AI reads fewer tokens, there is one source of truth, and the story stays warm for the community. Every AI reads English best.

- **D10. The live status note stays under 30 lines.**
  Why: AI context is limited. The status note is "now", the log is "history".

- **D11. Work in micro-steps and commit after each one.**
  Why: A sudden limit once killed a merge halfway. Now the most we can lose is one step.
- **D12. Dạng chuẩn duy nhất (Canonical-or-Error).**
  Why: Compiler chỉ nhận đúng 1 cách viết. Viết khác thì báo lỗi kèm bản chuẩn, nên không cần formatter hay style guide.

- **D13. Lỗi là bản vá (Error = Patch).**
  Why: Mỗi lỗi là JSON gồm vị trí, điều mong đợi, bản sửa chính xác và seed để chạy lại y hệt. AI áp bản vá rồi chạy lại, không cần người.

- **D14. Chứng minh chi phí (Cost Proof).**
  Why: Mọi vòng lặp đều có chặn, compiler tính cận trên CPU. Chương trình không chứng minh được ≤10ms thì không ship.

- **D15. Hiệu ứng khai báo (@).**
  Why: Lõi thuần, mọi thứ chạm bên ngoài (store, mạng, giờ, ngẫu nhiên) đều qua @ và được ghi vào sổ. Cùng sổ cộng cùng input ra cùng output.

- **D16. Ý định thay vì thủ tục (Intent).**
  Why: Chương trình nói làm gì (page, on), không nói chạy ở đâu. Host tự chọn, không có bước cấu hình thứ hai.

- **D17. Một file = một sản phẩm.**
  Why: Page và on nằm chung một file, ship tự tách phần trình duyệt và phần máy chủ. Full-stack không cần keo dán.

- **D18. Dấu niêm phong (Seal).**
  Why: Ship trả về mã băm của nguồn, bản chạy gắn với mã băm đó. Cùng nguồn là cùng sản phẩm, rollback chỉ là trỏ lại mã cũ.

- **D19. Chỉ số bắc đẩu (First-Try Rate).**
  Why: Đưa một AI mới chỉ spec 1 trang, đo bao nhiêu % chương trình chạy đúng ngay lần đầu. Kèm thuế token: tính năng tốn token hơn lợi thì bị loại.

- **D20. Lõi đóng băng + tầng tuổi thọ.**
  Why: Lõi chỉ thêm, không phá. Mỗi tầng đổi nhanh chậm khác nhau, câu nào hết đúng khi nền tảng biến mất thì không được vào luật.

- **D21. Gương (Mirror).**
  Why: Lệnh dịch bất kỳ chương trình ra tiếng người, chỉ đọc. Người đọc được là quà tặng, không phải mục tiêu; nguồn thật vẫn là bản AI viết.