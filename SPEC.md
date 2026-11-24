# SPEC.md (draft, T6 will finalize)

## Web

```text
page /
  tasks = []
  text = ""
  input text
  btn "Add"
    tasks = tasks + [text]
    text = ""
  each tasks t
    p t
```

Ghi chú: 10 dòng, 0 import, 0 config. Gán chỉ bằng =

## Worker

```text
on POST /echo
  need body.msg text
  reply {echo: body.msg}

on GET /hits
  reply {hits: @store.add "hits" 1}

on every 1h
  @store.del "hits"
```

Ghi chú: @ đánh dấu việc chạm ra ngoài, được ghi lại nên phát lại được. need thiếu hoặc sai kiểu thì trả lỗi JSON kèm bản sửa.
