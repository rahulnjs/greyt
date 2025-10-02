import { expect, test } from "@playwright/test";
import mdb from "../db/db";

require("dotenv").config({ path: ".env.development" });

const log: Array<{
  at: string;
  msg: string;
}> = [];

const doc: {
  user: string;
  date: string;
  seq: string;
  at: string;
} = {
  user: "",
  date: "",
  seq: "",
  at: "",
};

test.afterEach(async ({ page }, testInfo) => {
  const { db, close } = await mdb.connect();

  await db.collection("att_end").insertOne({
    ...doc,
    log,
    status: testInfo.status,
    duration: testInfo.duration,
    error: testInfo.error,
  });
  await close();
});

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
    const isHoliday = (hl as string[]).find((_d) => _d === d) !== undefined;
    const isWeekend = [0, 6].indexOf(new Date(d).getDay()) !== -1;
    return { isHoliday, isWeekend, shouldSkip: isHoliday || isWeekend };
  };

  const getCurrentDateString = () => responseData[apis[1]].currentDate;

  page.on("response", async (response) => {
    const parts = response.url().split("/");
    const api = parts[parts.length - 1];
    if (api_list.has(api)) {
      const json = await response.json();
      responseData[api] = process_api_data(json, api);
    }
  });

  doc.at = new Date().toISOString();

  log.push({
    at: new Date().toISOString(),
    msg: "Greyt automation started",
  });
  await page.goto("https://sberbank-brooks.greythr.com/v3/portal/");

  await page.getByLabel("Login ID").fill(String(process.env.grey_usr));
  await page.getByLabel("password").fill(String(process.env.grey_pwd));
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector("gt-employee-photo", { timeout: 10000 });
  await page.waitForTimeout(5000);
  log.push({
    at: new Date().toISOString(),
    msg: "Logged in for user " + process.env.grey_usr,
  });

  doc.user = String(process.env.grey_usr);
  doc.date = getCurrentDateString();
  const hlWk = isHolidayOrWeekend();

  if (!hlWk.shouldSkip) {
    const signInOutBtn = await page
      .locator("gt-button button.btn.btn-primary.btn-medium")
      .first();

    const text = await signInOutBtn.innerText();

    doc.seq = text;

    log.push({
      at: new Date().toISOString(),
      msg: `Greythr ${text} sequence started`,
    });

    await signInOutBtn.click();

    log.push({
      at: new Date().toISOString(),
      msg: `${text} button clicked`,
    });

    await page.waitForTimeout(5000);

    const tex2 = await signInOutBtn.innerText();

    if (text !== tex2) {
      log.push({
        at: new Date().toISOString(),
        msg: `${text} successful`,
      });
    }

    log.push({
      at: new Date().toISOString(),
      msg: `Greythr ${text} sequence finished`,
    });

    log.push({
      at: new Date().toISOString(),
      msg: `Logging out now`,
    });

    await page.getByTitle("Logout").click();
    await expect(page.getByText("😊")).toBeVisible();
  } else {
    log.push({
      at: new Date().toISOString(),
      msg:
        `Skipping login due to ${hlWk.isHoliday ? "holiday" : "weekend"} on ` +
        getCurrentDateString(),
    });
    await page.getByTitle("Logout").click();
    await expect(page.getByText("😊")).toBeVisible();
  }
  log.push({
    at: new Date().toISOString(),
    msg: "Greyt automation finshed",
  });

  await expect(page.getByText(" Go back to log in ")).toBeVisible();
});

//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
