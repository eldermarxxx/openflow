// Lógica pura do runner: nome do pacote, scripts de terminal e passos de onboarding.
// Sem acesso a disco ou processos, para poder ser testada.

export type Platform = "darwin" | "win32" | "linux";

export type ToolStatus = {
  flutter: string | null; // caminho do binário flutter
  sdk: string | null; // pasta do Android SDK
  avds: string[]; // emuladores criados (Android Virtual Devices)
  gmtool: string | null; // CLI do Genymotion, se instalado
  gmDevices: string[]; // aparelhos virtuais do Genymotion
};

export type Option = { label: string; detail?: string; commands: string[] };
export type Step = { id: string; title: string; detail: string; options: Option[]; done: boolean };

export type Emulator = { kind: "avd"; name: string } | { kind: "genymotion"; name: string; gmtool: string };

/** Escolhe o emulador: Genymotion se houver aparelho criado, senão o primeiro AVD. */
export function pickEmulator(s: ToolStatus): Emulator | null {
  if (s.gmtool && s.gmDevices.length) return { kind: "genymotion", name: s.gmDevices[0], gmtool: s.gmtool };
  if (s.avds.length) return { kind: "avd", name: s.avds[0] };
  return null;
}

/** Pronto para rodar: Flutter, Android SDK e algum emulador. */
export function isReady(s: ToolStatus): boolean {
  return !!s.flutter && !!s.sdk && pickEmulator(s) !== null;
}

/** Nome de pacote Dart válido (snake_case, começa com letra). */
export function packageName(name: string): string {
  const s = name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!s) return "openflow_app";
  return /^[a-z]/.test(s) ? s : `app_${s}`;
}

export type ScriptInput = { dir: string; pkg: string; flutter: string; sdk: string; emu: Emulator | null };

/** Script que o terminal executa: cria o projeto Flutter, sobe o emulador, gera o APK e roda ao vivo. */
export function runScript(platform: Platform, i: ScriptInput): { file: string; content: string } {
  if (platform === "win32") {
    const emu = `"${i.sdk}\\emulator\\emulator.exe"`;
    const adb = `"${i.sdk}\\platform-tools\\adb.exe"`;
    return {
      file: "run.bat",
      content: [
        "@echo off",
        "title OpenFlow - " + i.pkg,
        `cd /d "${i.dir}"`,
        `if not exist pubspec.yaml call "${i.flutter}" create --project-name ${i.pkg} --platforms android .`,
        `copy /Y .openflow\\main.dart lib\\main.dart >nul`,
        `${adb} devices | findstr /R /C:"device$" >nul`,
        !i.emu
          ? `if errorlevel 1 (echo Nenhum emulador criado. Crie um no Genymotion ou no Android Studio ^> Device Manager. & pause & exit /b 1)`
          : i.emu.kind === "avd"
            ? `if errorlevel 1 (echo Iniciando emulador ${i.emu.name}... & start "" ${emu} -avd "${i.emu.name}" & ${adb} wait-for-device & timeout /t 20 >nul)`
            : `if errorlevel 1 (echo Iniciando Genymotion ${i.emu.name}... & "${i.emu.gmtool}" admin start "${i.emu.name}" & ${adb} wait-for-device)`,
        `echo.`,
        `echo APK de debug: ${i.dir}\\build\\app\\outputs\\flutter-apk\\app-debug.apk`,
        `echo Ao vivo: r = hot reload, R = restart, q = sair`,
        `call "${i.flutter}" run`,
        "pause",
      ].join("\r\n"),
    };
  }
  const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;
  const adb = q(`${i.sdk}/platform-tools/adb`);
  return {
    file: platform === "darwin" ? "run.command" : "run.sh",
    content: [
      "#!/bin/bash",
      "set -e",
      `cd ${q(i.dir)}`,
      `[ -f pubspec.yaml ] || ${q(i.flutter)} create --project-name ${i.pkg} --platforms android .`,
      "cp .openflow/main.dart lib/main.dart",
      `if ! ${adb} devices | grep -qw device; then`,
      !i.emu
        ? `  echo "Nenhum emulador criado. Crie um no Genymotion ou no Android Studio > Device Manager."; exit 1`
        : [
            `  echo "Iniciando ${i.emu.kind === "avd" ? "emulador" : "Genymotion"} ${i.emu.name}..."`,
            i.emu.kind === "avd"
              ? `  nohup ${q(`${i.sdk}/emulator/emulator`)} -avd ${q(i.emu.name)} >/dev/null 2>&1 &`
              : `  ${q(i.emu.gmtool)} admin start ${q(i.emu.name)}`,
            `  ${adb} wait-for-device`,
            `  until [ "$(${adb} shell getprop sys.boot_completed 2>/dev/null | tr -d '\\r')" = "1" ]; do sleep 2; done`,
          ].join("\n"),
      "fi",
      `echo "APK de debug: ${i.dir}/build/app/outputs/flutter-apk/app-debug.apk"`,
      `echo "Ao vivo: r = hot reload, R = restart, q = sair"`,
      `${q(i.flutter)} run`,
    ].join("\n"),
  };
}

/** Comando que abre uma janela de terminal executando o script. */
export function terminalCommand(platform: Platform, scriptPath: string): { cmd: string; args: string[] } {
  if (platform === "darwin") return { cmd: "open", args: ["-a", "Terminal", scriptPath] };
  if (platform === "win32") return { cmd: "cmd.exe", args: ["/c", "start", '"OpenFlow"', "cmd", "/k", scriptPath] };
  return { cmd: "x-terminal-emulator", args: ["-e", "bash", scriptPath] };
}

/** Passo a passo de instalação, com alternativas, marcando o que já existe na máquina. */
export function onboardingSteps(platform: Platform, s: ToolStatus): Step[] {
  const flutter: Record<Platform, string[]> = {
    darwin: ["brew install --cask flutter"],
    win32: ["winget install --id Git.Git -e", "git clone https://github.com/flutter/flutter.git -b stable C:\\src\\flutter", 'setx PATH "%PATH%;C:\\src\\flutter\\bin"'],
    linux: ["sudo snap install flutter --classic"],
  };
  const studio: Record<Platform, string[]> = {
    darwin: ["brew install --cask android-studio"],
    win32: ["winget install --id Google.AndroidStudio -e"],
    linux: ["sudo snap install android-studio --classic"],
  };
  const cli: Record<Platform, string[]> = {
    darwin: ["brew install --cask android-commandlinetools"],
    win32: ["Baixe 'Command line tools only' em developer.android.com/studio e extraia em %LOCALAPPDATA%\\Android\\Sdk\\cmdline-tools\\latest"],
    linux: ["sudo apt install google-android-cmdline-tools-latest-installer || baixe em developer.android.com/studio"],
  };
  const sdkPkgs = 'sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"';
  const geny: Record<Platform, string[]> = {
    darwin: ["brew install --cask genymotion"],
    win32: ["winget install --id Genymobile.Genymotion -e"],
    linux: ["Baixe em genymotion.com/download"],
  };
  const reopen = platform === "win32" ? " Feche e abra o terminal (e o OpenFlow) para o PATH valer." : "";
  const hasEmu = pickEmulator(s) !== null;
  const ready = isReady(s);
  return [
    { id: "flutter", title: "Instalar o Flutter", detail: "O SDK que compila o app." + reopen, options: [{ label: "Instalar", commands: flutter[platform] }], done: !!s.flutter },
    {
      id: "sdk", title: "Instalar o Android SDK", detail: "Necessário para gerar o APK, mesmo usando Genymotion.",
      options: [
        { label: "Android Studio (mais fácil)", detail: "Abra uma vez e conclua o assistente: ele baixa o SDK e o emulador.", commands: studio[platform] },
        { label: "Só linha de comando (mais leve)", detail: "Sem IDE; ideal com Genymotion.", commands: [...cli[platform], sdkPkgs, "flutter config --android-sdk <pasta-do-sdk>"] },
      ],
      done: !!s.sdk,
    },
    { id: "licenses", title: "Aceitar as licenças do Android", detail: "Responda 'y' a todas.", options: [{ label: "Rodar", commands: ["flutter doctor --android-licenses"] }], done: ready },
    {
      id: "emulator", title: "Criar um emulador", detail: "Qualquer um serve; o OpenFlow usa Genymotion se houver aparelho criado.",
      options: [
        { label: s.gmtool ? "Genymotion (instalado)" : "Genymotion", detail: "Abra o Genymotion, clique em + e crie um aparelho (ex.: Google Pixel). Em Settings > ADB, aponte para o Android SDK para não conflitar com o Flutter.", commands: s.gmtool ? [] : geny[platform] },
        { label: "Emulador do Android Studio", detail: "Android Studio > More Actions > Virtual Device Manager > Create Device.", commands: [] },
      ],
      done: hasEmu,
    },
    { id: "doctor", title: "Conferir tudo", detail: "Itens de Android e Flutter devem aparecer com ✓.", options: [{ label: "Rodar", commands: ["flutter doctor"] }], done: ready },
  ];
}
