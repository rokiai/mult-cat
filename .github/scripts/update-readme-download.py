#!/usr/bin/env python3
"""Update README.md and README.zh-CN.md release download sections after a tag release."""

from __future__ import annotations

import os
import pathlib
import re
import sys

START = '<!-- release-download:start -->'
END = '<!-- release-download:end -->'


def build_block(*, repo: str, tag: str, version: str, locale: str) -> str:
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

  if locale == 'zh':
    lines = [
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
  else:
    lines = [
      START,
      badge,
      '',
      f'**Current version: [{tag}]({base}/tag/{tag})** · [All releases]({base})',
      '',
      '| Browser | Latest package | This version |',
      '| --- | --- | --- |',
      f'| Chrome / Edge / Chromium | [MultCat-chrome.zip]({chrome}) | [v{version}]({chrome_ver}) |',
      f'| Firefox | [MultCat-firefox.xpi]({firefox}) | [v{version}]({firefox_ver}) |',
      '',
      'Install (Chrome): download the zip → unzip → open `chrome://extensions` → '
      'enable Developer mode → **Load unpacked** → select the unzipped folder.',
      END,
    ]

  return '\n'.join(lines)


def update_readme(path: pathlib.Path, block: str) -> None:
  text = path.read_text(encoding='utf-8')
  pattern = re.compile(re.escape(START) + r'.*?' + re.escape(END), re.S)
  if not pattern.search(text):
    raise SystemExit(f'{path.name} missing release-download markers')
  path.write_text(pattern.sub(block, text), encoding='utf-8')
  print(f'{path.name} download section updated')


def main() -> int:
  repo = os.environ['REPO']
  tag = os.environ['TAG']
  version = os.environ['VERSION']
  root = pathlib.Path(__file__).resolve().parents[2]

  update_readme(root / 'README.md', build_block(repo=repo, tag=tag, version=version, locale='en'))
  update_readme(root / 'README.zh-CN.md', build_block(repo=repo, tag=tag, version=version, locale='zh'))
  return 0


if __name__ == '__main__':
  raise SystemExit(main())
