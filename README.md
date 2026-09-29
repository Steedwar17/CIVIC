# CIVIC

## Configuración del repositorio

### `.gitignore`

Se ha configurado un `.gitignore` robusto para este proyecto con el objetivo de garantizar que ningún archivo innecesario, sensible o privado sea subido al repositorio por error.

El archivo cubre, entre otros, los siguientes casos:

- **Archivos de sistema operativo**: macOS (`.DS_Store`, etc.), Windows (`Thumbs.db`, `desktop.ini`, etc.) y Linux.
- **Editores e IDEs**: VS Code, JetBrains (IntelliJ, WebStorm, PyCharm…), Sublime Text, Vim/Neovim y Emacs.
- **Lenguajes y entornos**: Node.js/JavaScript/TypeScript, Python, Java/Kotlin/Android, Swift/iOS, Ruby, Go, Rust, PHP y Dart/Flutter.
- **Variables de entorno y secretos**: archivos `.env`, claves (`.pem`, `.key`, `.p12`), credenciales y tokens de acceso.
- **Bases de datos**: archivos `.sqlite`, `.db`, `.sql`, dumps, etc.
- **Logs y temporales**: archivos `.log`, carpetas `tmp/`, `cache/`, etc.
- **Artefactos de build**: carpetas `dist/`, `build/`, `release/` y binarios compilados.
- **Infraestructura y cloud**: Docker, Terraform, Netlify, Vercel, Firebase, etc.
- **Pruebas y cobertura**: carpetas `coverage/`, reportes de test, snapshots, etc.
- **Archivos comprimidos**: `.zip`, `.tar`, `.gz`, `.rar`, `.7z`, etc.
- **Archivos de configuración local**: cualquier archivo marcado como `.local` u `.override`.