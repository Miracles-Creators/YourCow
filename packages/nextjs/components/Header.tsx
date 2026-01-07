"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "~~/lib/i18n/routing";
import { usePathname } from "~~/lib/i18n/routing";
import { useTranslations } from 'next-intl';
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { LanguageSwitcher } from "./LanguageSwitcher";

type HeaderMenuLink = {
  translationKey: string;
  href: string;
  icon?: React.ReactNode;
};

// YourCow navigation links
export const menuLinks: HeaderMenuLink[] = [
  {
    translationKey: "home",
    href: "/welcome",
  },
  {
    translationKey: "marketplace",
    href: "/marketplace",
  },
  {
    translationKey: "portfolio",
    href: "/portfolio",
  },
  // TODO: Add Dashboard link when ready
  // {
  //   translationKey: "dashboard",
  //   href: "/dashboard",
  // },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const t = useTranslations('common.header');

  return (
    <>
      {menuLinks.map(({ translationKey, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              className={`${
                isActive
                  ? "bg-vaca-green text-white shadow-md"
                  : "text-vaca-neutral-gray-700 hover:bg-vaca-green/10"
              } rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              {icon}
              <span>{t(translationKey)}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * YourCow Header
 * Clean navigation for cattle investment platform
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('common.header');
  const tBrand = useTranslations('brand');

  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="navbar min-h-0 shrink-0 justify-between z-20 px-4 sm:px-6 bg-vaca-neutral-white border-b-2 border-vaca-neutral-gray-100">
      <div className="navbar-start w-auto lg:w-1/2">
        {/* Mobile Menu */}
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`btn btn-ghost ${
              isDrawerOpen ? "hover:bg-vaca-green/10" : "hover:bg-transparent"
            }`}
            onClick={() => {
              setIsDrawerOpen((prevIsOpenState) => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-6 w-6 text-vaca-neutral-gray-700" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow-lg rounded-xl w-52 bg-vaca-neutral-white border-2 border-vaca-neutral-gray-100"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>

        {/* Logo */}
        <Link
          href="/welcome"
          className="hidden lg:flex items-center gap-3 ml-4 mr-6 shrink-0 group"
        >
          <div className="flex relative w-10 h-10">
            <Image
              alt="YourCow logo"
              className="cursor-pointer"
              fill
              src="/logo-your-cow.png"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-playfair text-lg font-bold leading-tight text-vaca-green">
              {tBrand('name')}
            </span>
            <span className="font-inter text-xs text-vaca-neutral-gray-500">
              {t('tagline')}
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>

      {/* Right Side - Language Switcher */}
      <div className="navbar-end gap-4">
        <LanguageSwitcher />

        {/* TODO: Add user profile/auth button when ready */}
        {/* <CustomConnectButton /> */}
      </div>
    </div>
  );
};
