import React from 'react';

interface LogoProps {
  className?: string;
  scrolled?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10 w-auto", scrolled = false }) => {
  return (
    <div className="flex items-center gap-3">
      {/* 
        Fixed: SVG is now inlined to ensure correct rendering without 'mm' unit issues.
        ViewBox is preserved from the original file (0 0 63.215 69.444).
      */}
      <svg
        viewBox="0 0 63.215 69.444"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <g id="layer1">
          <g id="g7722">
            {/* Green Part */}
            <g
              id="g2949"
              stroke="#4be196"
              strokeWidth="4.5"
              transform="translate(27.256979,24.069445)"
            >
              <path
                id="path1208"
                fill="#000000"
                fillOpacity="0"
                stroke="#4be196"
                strokeWidth="3.56599"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="0"
                transform="matrix(1.2627977,0,0,1.2610471,4.9945809,5.69632)"
                d="M -18.889552,-0.01660305 -19.005419,-10.829904 -0.03178715,-21.82104 18.973632,-10.884961 19.005422,0.07825243"
              />
              <path
                id="path1208-6"
                fill="none"
                stroke="#4be196"
                strokeWidth="7.42103"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="0"
                transform="matrix(0.6050542,0,0,0.607719,-7.5104408,-1.3306008)"
                d="M 19.005419,11.042255 0.03178715,22.033391 -18.973632,11.097312 -19.005419,-10.829904 -0.03178715,-21.82104"
              />
            </g>

            {/* Orange Part */}
            <g
              id="g2949-3"
              transform="matrix(-0.49310509,0.85662885,-0.85633736,-0.49327278,45.252472,38.235908)"
              fill="none"
              stroke="#e1964b"
              strokeWidth="4.55313"
            >
              <path
                id="path1208-7"
                fill="none"
                stroke="#e1964b"
                strokeWidth="3.60809"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="0"
                transform="matrix(1.2627977,0,0,1.2610471,4.9945809,5.69632)"
                d="M -18.889552,-0.01660305 -19.005419,-10.829904 -0.03178715,-21.82104 18.973632,-10.884961 19.005422,0.07825243"
              />
              <path
                id="path1208-6-1"
                fill="none"
                stroke="#e1964b"
                strokeWidth="7.50865"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="0"
                transform="matrix(0.6050542,0,0,0.607719,-7.5104408,-1.3306008)"
                d="M 19.005419,11.042255 0.03178715,22.033391 -18.973632,11.097312 -19.005419,-10.829904 -0.03178715,-21.82104"
              />
            </g>

            {/* Blue Part */}
            <g
              id="g2949-3-3"
              transform="rotate(-120.02232,25.599881,16.389296)"
              stroke="#4b96e1"
              strokeWidth="4.5"
            >
              <path
                id="path1208-7-7"
                fill="#000000"
                fillOpacity="0"
                stroke="#4b96e1"
                strokeWidth="3.56599"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="0"
                transform="matrix(1.2627977,0,0,1.2610471,4.9945809,5.69632)"
                d="M -18.889552,-0.01660305 -19.005419,-10.829904 -0.03178715,-21.82104 18.973632,-10.884961 19.005422,0.07825243"
              />
              <path
                id="path1208-6-1-4"
                fill="none"
                stroke="#4b96e1"
                strokeWidth="7.42103"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="0"
                transform="matrix(0.6050542,0,0,0.607719,-7.5104408,-1.3306008)"
                d="M 19.005419,11.042255 0.03178715,22.033391 -18.973632,11.097312 -19.005419,-10.829904 -0.03178715,-21.82104"
              />
            </g>

            {/* Extra Green Path */}
            <path
              id="path7572"
              fill="#4be196"
              stroke="#4be196"
              strokeWidth="4.50001"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit="0"
              d="M 8.3864618,26.49057 V 19.035937"
            />
          </g>
        </g>
      </svg>
      <div className="flex flex-col justify-center">
        <span className={`text-xl font-bold leading-none tracking-tight ${scrolled ? 'text-slate-800' : 'text-slate-900'}`}>
          创智实验室
        </span>
        <span className={`text-xs font-semibold tracking-widest uppercase ${scrolled ? 'text-[#E1964B]' : 'text-[#E1964B]'}`}>
          SparkMinds
        </span>
      </div>
    </div>
  );
};