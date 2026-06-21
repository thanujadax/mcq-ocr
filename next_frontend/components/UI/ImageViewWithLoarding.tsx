import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";

interface ImageViewWithLoardingProps {
  request_url: string;
  alt: string;
  width: number;
  height: number;
}

const ImageViewWithLoarding = ({
  request_url,
  alt,
  width,
  height,
}: ImageViewWithLoardingProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (request_url) {
        setIsLoading(true);
        const response = await fetch(request_url, {
          cache: "force-cache",
          headers: {
            "Cache-Control": "max-age=120",
          },
        });
        if (!response.ok) {
          setIsError(true);
          setIsLoading(false);
          return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setIsError(false);
        setIsLoading(false);
      }
    };
    fetchImage();
  }, [request_url]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <div className="w-8 h-8 mb-2 flex items-center justify-center bg-gray-200 rounded">
          <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-400" />
        </div>
        <p className="text-sm">Image not available</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <div className="w-8 h-8 mb-2 flex items-center justify-center">
          <span className="loader border-4 border-gray-300 border-t-blue-500 rounded-full w-8 h-8 animate-spin"></span>
        </div>
        <p className="text-sm">Loading...</p>
      </div>
    );
  }
  return (
    <Image
      src={imageUrl!}
      alt={alt}
      width={width}
      height={height}
      onError={() => setIsError(true)}
      onLoad={() => setIsLoading(false)}
    />
  );
};

export default ImageViewWithLoarding;
