---
title: PDFMathTranslate-next
---

## Github Repo

[PDFMathTranslate-next Github Repo](https://github.com/PDFMathTranslate-next/PDFMathTranslate-next)

compose更新日期: 2026-08-03

## docker-compose

```yaml
networks:
    1panel-network:
        external: true
services:
    pdf2zh-next:
        container_name: pdf2zh-next
        image: ${PDF2ZH_IMAGE}
        restart: unless-stopped

        environment:
            - TZ=${TIME_ZONE}

            # 默认语言
            - PDF2ZH_LANG_IN=${PDF2ZH_LANG_IN}
            - PDF2ZH_LANG_OUT=${PDF2ZH_LANG_OUT}

            # 如果使用 OpenAI / OpenAI-compatible 翻译服务(模型只能选一个)
            # - PDF2ZH_OPENAI=true
            # - PDF2ZH_OPENAI_API_KEY=${PDF2ZH_OPENAI_API_KEY}
            # - PDF2ZH_OPENAI_BASE_URL=${PDF2ZH_OPENAI_BASE_URL}
            # - PDF2ZH_OPENAI_MODEL=${PDF2ZH_OPENAI_MODEL}
            # 对不支持 reasoning_effort 的第三方 OpenAI-compatible 服务，则应关闭 SEND_REASONING_EFFORT
            # - PDF2ZH_OPENAI_SEND_REASONING_EFFORT=${PDF2ZH_OPENAI_SEND_REASONING_EFFORT}
            # 论文翻译通常建议关闭思考模式，none 可明确关闭支持该参数的模型推理；JSON 模式按需开启，默认关闭
            # - PDF2ZH_OPENAI_REASONING_EFFORT=${PDF2ZH_OPENAI_REASONING_EFFORT}
            # - PDF2ZH_OPENAI_ENABLE_JSON_MODE=${PDF2ZH_OPENAI_ENABLE_JSON_MODE}

            # 如果使用 DeepSeek 官方 API (模型只能选一个)
            - PDF2ZH_DEEPSEEK=true
            - PDF2ZH_DEEPSEEK_API_KEY=${PDF2ZH_DEEPSEEK_API_KEY}
            - PDF2ZH_DEEPSEEK_MODEL=${PDF2ZH_DEEPSEEK_MODEL}
            # 论文翻译通常建议关闭思考模式；JSON 模式按需开启，默认关闭
            - PDF2ZH_DEEPSEEK_THINKING_MODE=${PDF2ZH_DEEPSEEK_THINKING_MODE}
            - PDF2ZH_DEEPSEEK_REASONING_EFFORT=${PDF2ZH_DEEPSEEK_REASONING_EFFORT}
            - PDF2ZH_DEEPSEEK_ENABLE_JSON_MODE=${PDF2ZH_DEEPSEEK_ENABLE_JSON_MODE}

            
            # 并发限制
            - PDF2ZH_QPS=${PDF2ZH_QPS}
            - PDF2ZH_POOL_MAX_WORKERS=${PDF2ZH_POOL_MAX_WORKERS}
            - PDF2ZH_TERM_QPS=${PDF2ZH_TERM_QPS}
            - PDF2ZH_TERM_POOL_MAX_WORKERS=${PDF2ZH_TERM_POOL_MAX_WORKERS}

            # 长文档分段
            # - PDF2ZH_MAX_PAGES_PER_PART=${PDF2ZH_MAX_PAGES_PER_PART}
            # 翻译提示词，也可以加/no_think
            # - PDF2ZH_CUSTOM_SYSTEM_PROMPT=${PDF2ZH_CUSTOM_SYSTEM_PROMPT}

        labels:
            createdBy: Apps

        networks:
            - 1panel-network

        # 只在 Docker 网络内提供给 1Panel 反代
        expose:
            - "${PDF2ZH_CONTAINER_PORT}"

        volumes:
            - ./data:/app/pdf2zh_files
            - ./config:/root/.config/pdf2zh

        command:
            - pdf2zh
            - --gui
            - --server-port
            - "${PDF2ZH_CONTAINER_PORT}"
            - --ui-lang
            - zh
            - --enabled-services
            - DeepSeek
            # 如果使用OpenAI-compatible (模型只能选一个)
            # - OpenAI
            - --disable-gui-sensitive-input
            - --disable-config-auto-save

        cpus: ${PDF2ZH_CPU_LIMIT}
        mem_limit: ${PDF2ZH_MEMORY_LIMIT}
        pids_limit: 512

        security_opt:
            - no-new-privileges:true

        cap_drop:
            - ALL

        healthcheck:
            test:
                [
                    "CMD-SHELL",
                    "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:${PDF2ZH_CONTAINER_PORT}/', timeout=5)\""
                ]
            interval: 30s
            timeout: 10s
            start_period: 60s
            retries: 5
```

## env
```
TIME_ZONE=Asia/Shanghai

PDF2ZH_IMAGE=ghcr.io/pdfmathtranslate-next/pdfmathtranslate-next:latest
PDF2ZH_CONTAINER_PORT=7860

PDF2ZH_LANG_IN=en
PDF2ZH_LANG_OUT=zh-CN

# OpenAI 或兼容接口
# PDF2ZH_OPENAI_API_KEY=替换为你的API密钥
# PDF2ZH_OPENAI_BASE_URL=https://api.openai.com/v1
# PDF2ZH_OPENAI_MODEL=gpt-5.6-luna
# PDF2ZH_OPENAI_SEND_REASONING_EFFORT=true
# PDF2ZH_OPENAI_REASONING_EFFORT=low
# PDF2ZH_OPENAI_ENABLE_JSON_MODE=false

# DeepSeek 官方 API
PDF2ZH_DEEPSEEK_API_KEY=sk-替换为你的DeepSeek密钥
PDF2ZH_DEEPSEEK_MODEL=deepseek-v4-flash
PDF2ZH_DEEPSEEK_THINKING_MODE=disabled
PDF2ZH_DEEPSEEK_REASONING_EFFORT=high
PDF2ZH_DEEPSEEK_ENABLE_JSON_MODE=false

# 单用户保守并发
PDF2ZH_QPS=2
PDF2ZH_POOL_MAX_WORKERS=4

# 自动术语提取
PDF2ZH_TERM_QPS=1
PDF2ZH_TERM_POOL_MAX_WORKERS=2

# 长论文拆分处理
PDF2ZH_MAX_PAGES_PER_PART=50

# 资源限制
PDF2ZH_CPU_LIMIT=4
PDF2ZH_MEMORY_LIMIT=4g

# 翻译提示词，也可以加/no_think
# PDF2ZH_CUSTOM_SYSTEM_PROMPT=
```