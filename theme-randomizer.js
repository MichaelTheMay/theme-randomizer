// ==UserScript==
// @name         Generate Random Color Scheme
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Spice up the color scheme for your site with the click of a button
// @author       Michael May
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
(function () {
  const originalStyles = {
    body: {},
    headers: [],
    buttons: [],
    links: [],
    containers: [],
  };

  function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  function rgbToHex(rgb) {
    return (
      "#" +
      ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
        .toString(16)
        .slice(1)
        .toUpperCase()
    );
  }

  function getLuminance(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  }

  function getContrastRatio(color1, color2) {
    let lum1 = getLuminance(color1);
    let lum2 = getLuminance(color2);

    if (lum1 > lum2) {
      [lum1, lum2] = [lum2, lum1];
    }

    return (lum2 + 0.05) / (lum1 + 0.05);
  }

  function generateColorScheme() {
    const h = Math.random();
    const s = 0.5 + Math.random() * 0.5;
    const v = 0.7 + Math.random() * 0.45;
    const primaryRGB = HSVtoRGB(h, s, v);
    const secondaryRGB = HSVtoRGB((h + 1 / 12) % 1, s, v);
    const accentRGB = HSVtoRGB((h + 1 / 3) % 1, s, v);

    return {
      primary: `#${(
        (1 << 24) |
        (primaryRGB.r << 16) |
        (primaryRGB.g << 8) |
        primaryRGB.b
      )
        .toString(16)
        .slice(1)
        .toUpperCase()}`,
      secondary: `#${(
        (1 << 24) |
        (secondaryRGB.r << 16) |
        (secondaryRGB.g << 8) |
        secondaryRGB.b
      )
        .toString(16)
        .slice(1)
        .toUpperCase()}`,
      accent: `#${(
        (1 << 24) |
        (accentRGB.r << 16) |
        (accentRGB.g << 8) |
        accentRGB.b
      )
        .toString(16)
        .slice(1)
        .toUpperCase()}`,
    };
  }

  function adjustTextColor(backgroundColor) {
    const dark = [0, 0, 0]; // RGB for black
    const light = [255, 255, 255]; // RGB for white

    const contrastWithDark = getContrastRatio(backgroundColor, dark);
    const contrastWithLight = getContrastRatio(backgroundColor, light);

    return contrastWithDark >= contrastWithLight ? dark : light;
  }
  function findParentBgColor(element) {
    while (element) {
      const bgColor = getComputedStyle(element).backgroundColor;
      if (bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
        return bgColor;
      }
      element = element.parentElement;
    }
    return "white"; // default color if no parent with bg color is found
  }

  function styleHeaders(scheme) {
    const headers = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headers.forEach((header) => {
      const parentBgColor = findParentBgColor(header);
      originalStyles.headers.push({
        el: header,
        color: header.style.color,
        backgroundColor: header.style.backgroundColor,
      });

      const textColor = adjustTextColor(hexToRgb(scheme.secondary));

      // Additional styles for h1 and h2
      if (header.tagName === "H1" || header.tagName === "H2") {
        header.style.padding = "10px 20px";
        header.style.borderRadius = "5px";
        header.style.background = `linear-gradient(45deg, ${scheme.secondary}, ${scheme.accent})`;
      } else {
        header.style.backgroundColor = scheme.secondary;
      }

      header.style.color = rgbToHex(textColor);
      header.style.textShadow = "1px 1px 3px rgba(0,0,0,0.2)"; // subtle shadow
    });
  }

  function styleButtons(scheme) {
    const buttons = document.querySelectorAll(
      'button, input[type="button"], input[type="submit"]'
    );
    buttons.forEach((button) => {
      originalStyles.buttons.push({
        el: button,
        backgroundColor: button.style.backgroundColor,
        boxShadow: button.style.boxShadow,
      });

      button.style.backgroundColor = scheme.primary;
      button.style.color = rgbToHex(adjustTextColor(hexToRgb(scheme.primary)));
      button.style.boxShadow = "3px 3px 5px " + scheme.accent;
      button.style.transition = "all 0.3s ease";
      button.style.cursor = "pointer";

      button.addEventListener("mouseenter", () => {
        button.style.boxShadow = "1px 1px 3px " + scheme.accent;
        button.style.transform = "translateY(-2px)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.boxShadow = "3px 3px 5px " + scheme.accent;
        button.style.transform = "translateY(0)";
      });
    });
  }

  function styleLinks(scheme) {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      originalStyles.links.push({
        el: link,
        color: link.style.color,
      });
      link.style.color = scheme.primary;
      const bodyBackgroundColor = getComputedStyle(
        document.body
      ).backgroundColor;
      link.style.color = rgbToHex(
        adjustTextColor(hexToRgb(bodyBackgroundColor))
      );
    });
  }

  function styleContainers(scheme) {
    const containers = document.querySelectorAll(
      "header, footer, main, article, section, aside"
    );
    containers.forEach((container) => {
      originalStyles.containers.push({
        el: container,
        backgroundColor: container.style.backgroundColor,
      });

      const newBackgroundColor = scheme.secondary + "44"; // with some transparency
      container.style.backgroundColor = newBackgroundColor;
      container.style.color = rgbToHex(
        adjustTextColor(hexToRgb(newBackgroundColor))
      );
    });
  }

  function applyRandomStyling() {
    const scheme = generateColorScheme();
    document.body.style.transition = "background-color 0.3s ease";
    styleHeaders(scheme);
    styleButtons(scheme);
    styleLinks(scheme);
    styleContainers(scheme);
  }

  function revertStyling() {
    for (const header of originalStyles.headers) {
      header.el.style.color = header.color;
      header.el.style.backgroundColor = header.backgroundColor;
    }
    for (const button of originalStyles.buttons) {
      button.el.style.backgroundColor = button.backgroundColor;
      button.el.style.boxShadow = button.boxShadow;
    }
    for (const link of originalStyles.links) {
      link.el.style.color = link.color;
    }
    for (const container of originalStyles.containers) {
      container.el.style.backgroundColor = container.backgroundColor;
    }
  }

  const randomButton = document.createElement("button");
  randomButton.textContent = "🎨";
  randomButton.style.position = "fixed";
  randomButton.style.top = "10px";
  randomButton.style.left = "50%";
  randomButton.style.transform = "translateX(-50%)";
  randomButton.style.zIndex = "9999";
  randomButton.addEventListener("click", applyRandomStyling);

  const revertButton = document.createElement("button");
  revertButton.textContent = "⏪";
  revertButton.style.position = "fixed";
  revertButton.style.top = "10px";
  revertButton.style.left = "calc(50% + 30px)";
  revertButton.style.zIndex = "9999";
  revertButton.addEventListener("click", revertStyling);

  document.body.appendChild(randomButton);
  document.body.appendChild(revertButton);
})();
