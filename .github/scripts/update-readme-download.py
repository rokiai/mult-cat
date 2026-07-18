#!/usr/bin/env python3
"""Update README.md release download section after a tag release."""

from __future__ import annotations

import os
import pathlib
import re
import sys

START = '<!-- release-download:start -->'
END = '<!-- release-download:end -->'


def main() -> int:
  repo = os.environ['REPO']
  tag = os.environ['TAG']
  version = os.environ['VERSION']

  base = f'https://github.com/{repo}/releases'
  latest = f'{base}/latest'
  chrome = f'{latest}/download/MultCat-chrome.zip'
  firefox = f'{latest}/download/MultCat-firefox.xpi'
  chrome_ver = f'{base}/download/{tag}/MultCat-{version}-chrome.zip'
  firefox_ver = f'{base}/download/{tag}/MultCat-{version}-firefox.xpi'

  badge = (
    f'<p align="center">\n'
    f'  <a href="{latest}">'
    f'<img alt="Latest Release" '
    f'src="https://img.shields.io/github/v/release/{repo}?label=release&style=flat-square" />'
    f'</a>\n'
    f'</p>'
  )

  block = '\n'.join(
    [
      START,
      badge,
      '',
      f'**当前版本：[{tag}]({base}/tag/{tag})** · [全部 Releases]({base})',
      '',
      '| 浏览器 | 最新安装包 | 本版本 |',
      '| --- | --- | --- |',
      f'| Chrome / Edge / Chromium | [MultCat-chrome.zip]({chrome}) | [v{version}]({chrome_ver}) |',
      f'| Firefox | [MultCat-firefox.xpi]({firefox}) | [v{version}]({firefox_ver}) |',
      '',
      '安装（Chrome）：下载 zip → 解压 → 打开 `chrome://extensions` → '
      '开启开发者模式 → **加载已解压的扩展程序** → 选择解压后的文件夹。',
      END,
    ]
  )

  readme = pathlib.Path(__file__).resolve().parents[2] / 'README.md'
  text = readme.read_text(encoding='utf-8')
  pattern = re.compile(re.escape(START) + r'.*?' + re.escape(END), re.S)
  if not pattern.search(text):
    print('README.md missing release-download markers', file=sys.stderr)
    return 1

  readme.write_text(pattern.sub(block, text), encoding='utf-8')
  print('README download section updated')
  return 0


if __name__ == '__main__':
  raise SystemExit(main())
