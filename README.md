# Jarvis

## Development

create `service-account.secrets.json` at root folder

#### Commands

1. export secret path

```bash
// otherwise got `Error: Insufficient Permission`
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.secrets.json
```

2. **`yarn serve`** start firebase cloud functions

