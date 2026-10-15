// Lógica pura do runner: nome do pacote, scripts de terminal e passos de onboarding.
// Sem acesso a disco ou processos, para poder ser testada.

export type Platform = "darwin" | "win32" | "linux";

export type ToolStatus = {
  flutter: string | null; // caminho do binário flutter
  sdk: string | null; // pasta do Android SDK
  avds: string[]; // emuladores criados (Android Virtual Devices)
};

export type Step = { id: string; title: string; detail: string; commands: string[]; done: boolean };

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

export type ScriptInput = { dir: string; pkg: string; flutter: string; sdk: string; avd: string | null };

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
        i.avd
          ? `if errorlevel 1 (echo Iniciando emulador ${i.avd}... & start "" ${emu} -avd "${i.avd}" & ${adb} wait-for-device & timeout /t 20 >nul)`
          : `if errorlevel 1 (echo Nenhum emulador criado. Crie um no Android Studio ^> Device Manager. & pause & exit /b 1)`,
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
      i.avd
        ? [
            `  echo "Iniciando emulador ${i.avd}..."`,
            `  nohup ${q(`${i.sdk}/emulator/emulator`)} -avd ${q(i.avd)} >/dev/null 2>&1 &`,
            `  ${adb} wait-for-device`,
            `  until [ "$(${adb} shell getprop sys.boot_completed 2>/dev/null | tr -d '\\r')" = "1" ]; do sleep 2; done`,
          ].join("\n")
        : `  echo "Nenhum emulador criado. Crie um no Android Studio > Device Manager."; exit 1`,
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

/** Passo a passo de instalação, marcando o que já existe na máquina. */
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
  const reopen = platform === "win32" ? " Feche e abra o terminal (e o OpenFlow) para o PATH valer." : "";
  return [
    { id: "flutter", title: "Instalar o Flutter", detail: "O SDK que compila o app." + reopen, commands: flutter[platform], done: !!s.flutter },
    { id: "studio", title: "Instalar o Android Studio", detail: "Abra o Android Studio uma vez e conclua o assistente: ele baixa o Android SDK.", commands: studio[platform], done: !!s.sdk },
    { id: "licenses", title: "Aceitar as licenças do Android", detail: "Responda 'y' a todas.", commands: ["flutter doctor --android-licenses"], done: !!s.flutter && !!s.sdk && s.avds.length > 0 },
    { id: "avd", title: "Criar um emulador", detail: "Android Studio > More Actions > Virtual Device Manager > Create Device (ex.: Pixel, imagem recomendada).", commands: [], done: s.avds.length > 0 },
    { id: "doctor", title: "Conferir tudo", detail: "Itens de Android e Flutter devem aparecer com ✓.", commands: ["flutter doctor"], done: !!s.flutter && !!s.sdk && s.avds.length > 0 },
  ];
}
