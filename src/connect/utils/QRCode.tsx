import React, { ReactElement, useMemo } from "react";
import QRCodeUtil from "qrcode";
import { tw } from "twind";

import { WalletIcon } from "../wallets";

// Adapted from https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit/src/components/QRCode/QRCode.tsx

const generateMatrix = (
  value: string,
  errorCorrectionLevel: QRCodeUtil.QRCodeErrorCorrectionLevel
) => {
  const arr = Array.prototype.slice.call(
    QRCodeUtil.create(value, { errorCorrectionLevel }).modules.data,
    0
  );
  const sqrt = Math.sqrt(arr.length);
  return arr.reduce(
    (rows, key, index) =>
      (index % sqrt === 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    []
  );
};

const generateDots = ({
  ecl,
  uri,
  size,
  logoSize,
  logoColor,
  darkMode,
}: {
  ecl: QRCodeUtil.QRCodeErrorCorrectionLevel;
  logoSize: number;
  logoColor: string;
  darkMode: boolean;
  size: number;
  uri: string;
}): ReactElement[] => {
  const dots: ReactElement[] = [];
  const matrix = generateMatrix(uri, ecl);
  const cellSize = size / matrix.length;
  let qrList = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  qrList.forEach(({ x, y }) => {
    const x1 = (matrix.length - 7) * cellSize * x;
    const y1 = (matrix.length - 7) * cellSize * y;
    for (let i = 0; i < 3; i++) {
      dots.push(
        <rect
          fill={
            darkMode
              ? i % 2 !== 0
                ? "#26293B"
                : "white"
              : i % 2 !== 0
              ? "white"
              : logoColor
          } // Can't use logocolor in darkmode because contrast sometimes too low for qr code perf
          height={cellSize * (7 - i * 2)}
          key={`${i}-${x}-${y}`}
          rx={(i - 2) * -5 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
          ry={(i - 2) * -5 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
          width={cellSize * (7 - i * 2)}
          x={x1 + cellSize * i}
          y={y1 + cellSize * i}
        />
      );
    }
  });

  const clearArenaSize = Math.floor((logoSize + 25) / cellSize);
  const matrixMiddleStart = matrix.length / 2 - clearArenaSize / 2;
  const matrixMiddleEnd = matrix.length / 2 + clearArenaSize / 2 - 1;

  matrix.forEach((row: QRCodeUtil.QRCode[], i: number) => {
    row.forEach((_: any, j: number) => {
      if (matrix[i][j]) {
        if (
          !(
            (i < 7 && j < 7) ||
            (i > matrix.length - 8 && j < 7) ||
            (i < 7 && j > matrix.length - 8)
          )
        ) {
          if (
            !(
              i > matrixMiddleStart &&
              i < matrixMiddleEnd &&
              j > matrixMiddleStart &&
              j < matrixMiddleEnd
            )
          ) {
            dots.push(
              <circle
                cx={i * cellSize + cellSize / 2}
                cy={j * cellSize + cellSize / 2}
                fill={darkMode ? "white" : "black"}
                key={`circle-${i}-${j}`}
                r={cellSize / 3} // calculate size of single dots
              />
            );
          }
        }
      }
    });
  });

  return dots;
};

type Props = {
  ecl?: QRCodeUtil.QRCodeErrorCorrectionLevel;
  logoColor?: string;
  logoMargin?: number;
  logoSize?: number;
  size?: number;
  uri: string;
  logo: WalletIcon;
  disabled?: boolean;
  darkMode?: boolean;
};

export default function QRCode({
  ecl = "M",
  logoColor = "black",
  logoMargin = 10,
  logoSize = 50,
  logo: Logo,
  size: sizeProp = 300,
  uri,
  disabled = false,
  darkMode = false,
}: Props) {
  const padding: string = "10";
  // calculate size of the QRCode
  const size = sizeProp - parseInt(padding, 10) * 1;

  // create dots for QR code
  const dots = useMemo(
    () =>
      generateDots({
        ecl,
        logoSize,
        logoColor,
        size,
        uri,
        darkMode,
      }),
    [ecl, logoSize, size, uri]
  );

  const logoWrapperSize = logoSize + logoMargin * 2;

  return (
    <div
      className={tw`relative w-full h-full flex-1 flex items-center justify-center bg-white dark:bg-[#26293B] p-[${padding}px] rounded-xl`}
      style={{
        filter: disabled ? "blur(4px)" : "none",
      }}
    >
      <div
        className={tw`flex justify-center items-center`}
        style={{
          height: size,
          userSelect: "none",
          width: size,
        }}
      >
        <div
          className={tw`absolute rounded-xl`}
          style={{
            height: logoSize,
            width: logoSize,
          }}
        >
          <Logo width={logoSize} height={logoSize} />
        </div>
        <svg height={size} style={{ all: "revert" }} width={size}>
          <defs>
            <clipPath id="clip-wrapper">
              <rect height={logoWrapperSize} width={logoWrapperSize} />
            </clipPath>
            <clipPath id="clip-logo">
              <rect height={logoSize} width={logoSize} />
            </clipPath>
          </defs>
          <rect fill="transparent" height={size} width={size} />
          {dots}
        </svg>
      </div>
    </div>
  );
}
