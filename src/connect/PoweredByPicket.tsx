import React from "react";
import { tw } from "twind";

const PoweredByPicket = () => {
  return (
    <div
      className={tw`w-full mt-8 text-center font-base text-sm text-gray-400`}
    >
      <a
        style={{
          outlineOffset: "4px",
        }}
        target="_blank"
        rel="noopener noreferrer"
        href="https://picketapi.com"
      >
        Powered by Picket
      </a>
    </div>
  );
};

export default PoweredByPicket;
