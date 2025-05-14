import { expect, type Page } from "@playwright/test"

export async function captureResponsiveScreenshots(page: Page, name: string) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.screenshot({ path: `screenshots/${name}-desktop.png` })

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.screenshot({ path: `screenshots/${name}-tablet.png` })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: `screenshots/${name}-mobile.png` })
}

export async function testResponsiveElement(page: Page, selector: string, expectedStyles: Record<string, any>[]) {
  const viewports = [
    { width: 1920, height: 1080, name: "desktop" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 375, height: 812, name: "mobile" },
  ]

  for (let i = 0; i < viewports.length; i++) {
    const viewport = viewports[i]
    const expectedStyle = expectedStyles[i]

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await expect(page.locator(selector)).toBeVisible()

    if (expectedStyle) {
      const styles = await page.evaluate((sel) => {
        const element = document.querySelector(sel)
        if (!element) return null

        const computed = window.getComputedStyle(element)
        return {
          fontSize: computed.fontSize,
          padding: computed.padding,
          margin: computed.margin,
          display: computed.display,
        }
      }, selector)

      for (const [property, value] of Object.entries(expectedStyle)) {
        expect(styles?.[property]).toBe(value)
      }
    }
  }
}
