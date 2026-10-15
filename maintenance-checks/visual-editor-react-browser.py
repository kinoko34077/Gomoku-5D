#!/usr/bin/env python3
"""Opt-in React/model layout pilot in real Chromium; no release or app-domain writes."""
from pathlib import Path
from subprocess import DEVNULL, Popen
from time import sleep
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "http://127.0.0.1:8789"
SEL = '[data-ve-model-pilot="1"]'

def card_ids(page):
    return page.locator(SEL + " [data-ve-id]").evaluate_all(
        "(els) => els.map(el => el.getAttribute('data-ve-id'))"
    )

def wait_ids(page, expected):
    page.wait_for_function(
        """ids => Array.from(document.querySelectorAll('[data-ve-model-pilot="1"] [data-ve-id]'))
          .map(el => el.getAttribute('data-ve-id')).join(',') === ids""",
        ",".join(expected), timeout=12000
    )

def main():
    proc=Popen(["npm", "run", "preview", "--", "--host", "127.0.0.1",
                "--port", "8789", "--strictPort"], cwd=ROOT, stdout=DEVNULL, stderr=DEVNULL)
    try:
        for _ in range(80):
            try:
                with urlopen(ORIGIN + "/", timeout=1) as response:
                    if response.status == 200:
                        break
            except Exception:
                sleep(.2)
        else:
            raise RuntimeError("Vite preview did not start")
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path="/usr/bin/google-chrome",
                                        args=["--no-sandbox", "--disable-dev-shm-usage"])
            try:
                page=browser.new_page(viewport={"width":1280,"height":800})
                errors=[]
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto(ORIGIN+"/",wait_until="networkidle")
                assert page.locator(SEL).count()==0, "normal URL loaded pilot"
                assert not page.evaluate("""() => performance.getEntriesByType('resource')
                    .some(e => e.name.includes('ReactModelPilot-'))"""), "normal URL fetched pilot"
                page.goto(ORIGIN+"/?visual_editor_model=1",wait_until="networkidle")
                page.locator(SEL+" [data-ve-id='subtitle']").wait_for()
                assert card_ids(page)==["title","subtitle","footer"]
                page.locator(SEL+" [data-ve-id='subtitle']").click()
                page.locator(SEL+" [data-action='up']").click()
                wait_ids(page,["subtitle","title","footer"])
                page.locator(SEL+" [data-action='duplicate']").click()
                wait_ids(page,["subtitle","copy-1","title","footer"])
                page.locator(SEL+" [data-action='undo']").click()
                wait_ids(page,["subtitle","title","footer"])
                page.locator(SEL+" [data-action='redo']").click()
                wait_ids(page,["subtitle","copy-1","title","footer"])
                page.locator(SEL+" [data-ve-id='copy-1']").click()
                page.locator(SEL+" [data-action='remove']").click()
                wait_ids(page,["subtitle","title","footer"])
                page.locator(SEL+" [data-action='undo']").click()
                wait_ids(page,["subtitle","copy-1","title","footer"])
                assert not errors, errors
                page.set_viewport_size({"width":390,"height":844})
                assert page.locator(SEL).count()==1
                rect=page.locator(SEL).bounding_box()
                assert rect and rect["x"]>=0 and rect["x"]+rect["width"]<=391, rect
                page.goto(ORIGIN+"/",wait_until="domcontentloaded")
                assert page.locator(SEL).count()==0, "ordinary browser state leaked"
            finally:
                browser.close()
    finally:
        proc.terminate()
        try: proc.wait(timeout=5)
        except Exception: proc.kill()
    print("M4 React model Chrome PASS: opt-in, model reorder, factory copy, delete, undo/redo, 1280/390")

if __name__=="__main__":
    main()
