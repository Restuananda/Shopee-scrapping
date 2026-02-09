# Proxy List Configuration

This document describes the standardized proxy list format used to route network traffic through various proxy servers. It supports authenticated and non-authenticated proxies and is suitable for automation tools, scrapers, crawlers, and network utilities.

---

## Proxy Format

Each proxy entry must follow this structure:


### Fields Explanation
- **host** — Proxy hostname or IP address  
- **port** — Proxy port  
- **type** — Proxy protocol (`http`, `https`, `socks5`)  
- **username** — Authentication username (optional)  
- **password** — Authentication password (optional)

If authentication is not required, leave the `username` and `password` fields empty.

---

## Supported Proxy Types

- `http`
- `https`
- `socks5`

---

## Example Proxies

```txt
proxy1.example.com:8080:http:user1:pass1
proxy2.example.com:8080:http:user2:pass2
192.168.1.100:3128:https:admin:secure_pass
socks-proxy.example.com:1080:socks5

id-proxy1.example.com:8080:http:username:password
id-proxy2.example.com:8080:http:username:password

# 103.152.112.162:80:http
# 202.169.51.46:8080:http


If you want, I can also:
- make it **shorter/minimal**
- tailor it for **scraping bots**
- add a **parser example (Go / JS)**  
Just say 👌
