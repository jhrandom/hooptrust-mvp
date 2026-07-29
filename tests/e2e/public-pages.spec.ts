import { expect, test } from "@playwright/test";

test("homepage presents the core recruiting workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn game footage into trusted recruiting profiles/i })).toBeVisible();
  await expect(page.getByText("Upload", { exact: true })).toBeVisible();
  await expect(page.getByText("Verify", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore Rhythm/i })).toBeVisible();
});

test("authentication forms expose required controls", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("required", "");
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "8");
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /Create your HoopTrust account/i })).toBeVisible();
  await expect(page.getByLabel("Account type")).toContainText("Parent / Guardian");
  await expect(page.getByLabel("Account type")).toContainText("College Recruiter");
});

test("legal and safeguarding pages are reachable", async ({ page }) => {
  for (const [path, heading] of [
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of service"],
    ["/safety", "Minor athlete safety"]
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("Rhythm situation controls are interactive", async ({ page }) => {
  await page.goto("/rhythm");
  await page.getByRole("button", { name: /Training/i }).click();
  await page.getByRole("button", { name: /Tired/i }).click();
  await page.getByRole("button", { name: /Push intensity/i }).click();
  await expect(page.getByText(/High-Intensity Training|high-energy/i).first()).toBeVisible();
});

test("layout remains usable on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only layout assertion.");
  await page.goto("/");
  const bodyWidth = await page.locator("body").evaluate((body) => body.scrollWidth);
  const viewportWidth = page.viewportSize()?.width ?? 0;
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});
