import type { Request, Response } from "express";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppError } from "../middleware/error.middleware.js";

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const flagEmoji = (countryCode: string): string =>
  String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((letter) => 127397 + letter.charCodeAt(0)),
  );

export interface CountryLocation {
  code: string;
  name: string;
  dialCode: string;
  phoneFormat: string;
  flagEmoji: string;
  flagImage: string;
}
const allCountries: CountryLocation[] = getCountries()
  .flatMap((code) => {
    try {
      const dialCode = `+${getCountryCallingCode(code)}`;
      return [
        {
          code,
          name: displayNames.of(code) ?? code,
          dialCode,
          phoneFormat: `${dialCode} [national number]`,
          flagEmoji: flagEmoji(code),
          flagImage: `https://flagcdn.com/w80/${code.toLowerCase()}.png`,
        },
      ];
    } catch {
      return [];
    }
  })
  .sort((first, second) => first.name.localeCompare(second.name));

export const listCountries = asyncHandler(
  async (req: Request, res: Response) => {
    const search = String(req.query.search ?? "")
      .trim()
      .toLowerCase();
    const countries = search
      ? allCountries.filter(
          (country) =>
            country.name.toLowerCase().includes(search) ||
            country.code.toLowerCase().includes(search) ||
            country.dialCode.includes(search),
        )
      : allCountries;
    res.json({
      success: true,
      message: "Countries retrieved",
      data: countries,
    });
  },
);

export const getCountry = asyncHandler(async (req: Request, res: Response) => {
  const country = allCountries.find(
    (item) => item.code === String(req.params.code).toUpperCase(),
  );
  if (!country) throw createAppError("Country not found", 404);
  res.json({ success: true, message: "Country retrieved", data: country });
});

export const formatPhone = asyncHandler(async (req: Request, res: Response) => {
  const { countryCode, phone } = req.body as {
    countryCode?: string;
    phone?: string;
  };
  if (!countryCode || !phone)
    throw createAppError("countryCode and phone are required", 400);
  const parsed = parsePhoneNumberFromString(
    phone,
    countryCode.toUpperCase() as CountryCode,
  );
  if (!parsed) throw createAppError("Enter a valid phone number", 400);
  res.json({
    success: true,
    message: "Phone number formatted",
    data: {
      countryCode: parsed.country,
      e164: parsed.number,
      international: parsed.formatInternational(),
      national: parsed.formatNational(),
      isValid: parsed.isValid(),
    },
  });
});
