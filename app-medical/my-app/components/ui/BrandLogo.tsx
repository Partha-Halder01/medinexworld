import Image from 'next/image';

type BrandLogoProps = {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  nameClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  showName?: boolean;
  priority?: boolean;
  stacked?: boolean;
};

export const BrandLogo = ({
  size = 40,
  width,
  height,
  className = '',
  imageClassName = '',
  nameClassName = '',
  subtitle,
  subtitleClassName = '',
  showName = false,
  priority = false,
  stacked = false,
}: BrandLogoProps) => {
  const logoWidth = width ?? (height ? Math.round(height * 2.61) : (size ? Math.round(size * 2.61) : 156));
  const logoHeight = height ?? (width ? Math.round(width / 2.61) : (size || 60));

  return (
    <div className={`flex ${stacked ? 'flex-col items-start gap-1.5' : 'items-center gap-2'} ${className}`.trim()}>
    <Image
      src="/newlogos.png"
      alt="Medinex World logo"
      width={logoWidth}
      height={logoHeight}
      priority={priority}
      className={`object-contain select-none ${imageClassName || 'w-auto h-auto max-h-full'}`.trim()}
    />
    {(showName || subtitle) && (
      <div className="flex flex-col">
        {showName ? (
          <span className={nameClassName || 'text-xl font-bold tracking-tight text-gray-900 dark:text-white'}>
            Medinex World
          </span>
        ) : null}
        {subtitle ? <span className={subtitleClassName}>{subtitle}</span> : null}
      </div>
    )}
    </div>
  );
};
