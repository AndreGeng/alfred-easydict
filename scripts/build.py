#!/usr/bin/env python3
"""Build a self-contained Alfred package using only the Python standard library."""
import json
import plistlib
import struct
import zlib
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
VERSION = json.loads((ROOT / "package.json").read_text())["version"]


def setting(variable, label, default, description):
    return {"type": "textfield", "variable": variable, "label": label,
            "description": description,
            "config": {"default": default, "placeholder": "", "required": False, "trim": True}}


def manifest():
    search, action, universal, speech = "SEARCH", "ACTION", "UNIVERSAL", "SPEECH"
    connection = lambda dest, modifiers=0, keep_open=False: {
        "destinationuid": dest, "modifiers": modifiers,
        "modifiersubtext": "", "vitoclose": keep_open}
    return {
        "bundleid": "local.alfred-easydict", "name": "Easydict for Alfred",
        "description": "在 Alfred 内查词和翻译，独立运行，无需 Easydict App",
        "createdby": "Alfred Easydict contributors", "version": VERSION,
        "disabled": False, "readme": (ROOT / "README.md").read_text(),
        "connections": {
            search: [connection(action), connection(speech, 1048576, True)],
            universal: [connection(search)]},
        "objects": [
            {"uid": search, "type": "alfred.workflow.input.scriptfilter", "version": 3,
             "config": {"keyword": "{var:keyword}", "withspace": True,
                        "title": "Easydict · 查词 / 翻译", "subtext": "输入单词、短语或句子；:ja 内容译为日语",
                        "runningsubtext": "正在查询…", "argumenttype": 1,
                        "argumenttrimmode": 1, "argumenttreatemptyqueryasnil": False,
                        "alfredfiltersresults": False, "escaping": 102,
                        "script": '/bin/bash ./launch.sh --query "$1"', "scriptargtype": 1,
                        "scriptfile": "", "type": 0, "queuemode": 2,
                        "queuedelaymode": 1, "queuedelaycustom": 3,
                        "queuedelayimmediatelyinitially": False}},
            {"uid": action, "type": "alfred.workflow.action.script", "version": 2,
             "config": {"script": '/bin/bash ./launch.sh --action "$1"',
                        "scriptargtype": 1, "scriptfile": "", "type": 0, "escaping": 102,
                        "concurrently": False}},
            {"uid": speech, "type": "alfred.workflow.action.script", "version": 2,
             "config": {"script": '/bin/bash ./launch.sh --action "$1"',
                        "scriptargtype": 1, "scriptfile": "", "type": 0, "escaping": 102,
                        "concurrently": True}},
            {"uid": universal, "type": "alfred.workflow.trigger.universalaction", "version": 1,
             "config": {"acceptsfiles": False, "acceptsmulti": 0, "acceptstext": True,
                        "acceptsurls": False, "name": "Easydict 查词 / 翻译"}}
        ],
        "uidata": {search: {"xpos": 280, "ypos": 100}, action: {"xpos": 560, "ypos": 100},
                   universal: {"xpos": 40, "ypos": 100}, speech: {"xpos": 560, "ypos": 300}},
        "userconfigurationconfig": [
            setting("keyword", "查询关键词", "ed", "默认 ed，可自行改为 yd。"),
            setting("providers", "查询来源", "Youdao,Google", "逗号分隔：Youdao、Google、Bing。Bing 可选。"),
            setting("target_language", "首选目标语言 / Preferred target", "zh", "zh, en, ja, ko, fr, de, es, it, pt, ru, ar。默认 zh；:语言 前缀优先 / Explicit prefixes override this."),
            setting("secondary_language", "第二语言 / Secondary language", "en", "原文为首选语言时使用；须与首选语言不同 / Used when the source matches the preferred target; choose a different language."),
            setting("node_path", "Node.js 路径", "", "可留空自动检测；找不到时填写 Node.js 18+ 可执行文件绝对路径。"),
            setting("cache_hours", "缓存小时数", "24", "0–168。0 只保留当前查询状态约 1 秒；网络查询状态最多保留 20 秒。")
        ]
    }


def icon():
    # Original simple ED monogram, no third-party image assets.
    size = 128
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            inside = (12 <= x < 116 and 12 <= y < 116)
            color = (24, 37, 49, 255) if inside else (0, 0, 0, 0)
            e = (32 <= x < 39 and 39 <= y < 89) or (32 <= x < 59 and any(a <= y < a + 7 for a in (39, 60, 82)))
            d = (70 <= x < 77 and 39 <= y < 89) or (70 <= x < 92 and (39 <= y < 46 or 82 <= y < 89)) or (91 <= x < 98 and 46 <= y < 82)
            if e or d:
                color = (161, 229, 205, 255)
            row.extend(color)
        rows.append(bytes(row))
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows))) + chunk(b'IEND', b'')


def main():
    DIST.mkdir(exist_ok=True)
    package = DIST / f"Alfred-Easydict-{VERSION}.alfredworkflow"
    data = manifest()
    with ZipFile(package, 'w', ZIP_DEFLATED) as output:
        output.writestr('info.plist', plistlib.dumps(data))
        output.writestr('icon.png', icon())
        for name in ('src', 'licenses', 'docs/screenshots'):
            for path in sorted((ROOT / name).glob('*')):
                if path.is_file():
                    output.write(path, str(path.relative_to(ROOT)))
        for name in ('launch.sh', 'README.md', 'README.en.md', 'LICENSE', 'THIRD_PARTY.md', 'VERIFICATION.md'):
            output.write(ROOT / name, name)
    with ZipFile(package) as package_check:
        assert package_check.testzip() is None
        assert plistlib.loads(package_check.read('info.plist'))['bundleid'] == data['bundleid']
    print(package)


if __name__ == '__main__':
    main()
