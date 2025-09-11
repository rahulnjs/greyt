import { expect, test } from "@playwright/test";

require("dotenv").config({ path: ".env.development" });

console.log();

test("on login page", async ({ page }) => {
  const responseData = {};
  const apis = ["upcomingHolidays", "markAttendance"];
  const api_list = new Set(apis);

  const process_api_data = (data, _api) => {
    if (_api === apis[0]) {
      return data[_api].map((d) => d.holidayDate);
    }
    if (_api === apis[1]) {
      return data["attendanceInfo"];
    }
  };

  const isHolidayOrWeekend = () => {
    const hl = responseData[apis[0]];
    const d = responseData[apis[1]].currentDate;
    const isHoliday = (hl as string[]).find((_d) => _d === d) === undefined;
    const isWeekend = [0, 6].indexOf(new Date(d).getDay()) !== -1;
    return isHoliday || isWeekend;
  };

  const getCurrentDate = () => new Date(responseData[apis[1]].currentDate);

  page.on("response", async (response) => {
    const parts = response.url().split("/");
    const api = parts[parts.length - 1];
    if (api_list.has(api)) {
      const json = await response.json();
      responseData[api] = process_api_data(json, api);
    }
  });
  await page.goto("https://sberbank-brooks.greythr.com/v3/portal/");

  await page.getByLabel("Login ID").fill(String(process.env.grey_usr));
  await page.pause();
  await page.getByLabel("password").fill(String(process.env.grey_pwd));
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector("button.btn.btn-primary", { timeout: 5000 });
  await page.waitForTimeout(5000);
  if (isHolidayOrWeekend()) {
    // (
    //   await page.waitForSelector("button.btn.btn-primary", {
    //     timeout: 5000,
    //   })
    // ).click();
    const signInOutBtn = await page
      .locator("gt-button button.btn.btn-primary.btn-medium")
      .first();

    const text = await signInOutBtn.innerText();

    if (text === "Sign In") {
    } else if (text === "Sign Out") {
    }

    console.log("✓ Logged in!", text);
    await page.waitForTimeout(5000);
    await page.getByTitle("Logout").click();
    await expect(page.getByText("😊")).toBeVisible();
  } else {
    console.log("Skipping login due to holiday/weekend on ", getCurrentDate());
  }
});

//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
