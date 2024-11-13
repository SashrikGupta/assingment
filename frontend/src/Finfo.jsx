import React, { useState } from 'react';

export default function Finfo({ frame }) {
  const [selectedContent, setSelectedContent] = useState('');

  const handleSelect = (content) => {
    setSelectedContent(content);
  };

  return (
    <div className="p-4 bg-gray-900 h-[35vh] text-white w-[22vw]">
      {/* Frame Information in a Horizontal Flex Layout */}
      <div className="flex flex-wrap space-x-4 w-[20vw] bg-gray-800 p-4 rounded-lg shadow-md mb-8">
        {/* Kind */}
        <div
          className="bg-gray-700 p-2 rounded-lg flex items-center justify-center h-12 w-12 cursor-pointer"
          onClick={() => handleSelect(`Kind: ${frame.kind}`)}
        >
          kind
        </div>

        {/* Seq */}
        <div
          className="bg-gray-700 p-2 rounded-lg flex items-center justify-center h-12 w-12 cursor-pointer"
          onClick={() => handleSelect(`Seq: ${frame.seq}`)}
        >
          seq
        </div>

        {/* Ack */}
        <div
          className="bg-gray-700 p-2 rounded-lg flex items-center justify-center h-12 w-12 cursor-pointer"
          onClick={() => handleSelect(`Ack: ${frame.ack}`)}
        >
          ack
        </div>

        {/* Message */}
        <div
          className="relative bg-gray-700 p-2 rounded-lg flex items-center justify-center h-12 w-12 cursor-pointer"
          onClick={() => handleSelect(`Message: ${frame.info.data}`)}
        >
          {/* Show first 15 characters initially */}
          <span className="whitespace-nowrap">data</span>
        </div>

        {/* Checksum */}
        <div
          className="bg-gray-700 p-2 rounded-lg flex items-center justify-center h-12 w-12 cursor-pointer"
          onClick={() => handleSelect(`Checksum: ${frame.checksum}`)}
        >
          sum
        </div>
      </div>

      {/* Section to Display Selected Content */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-md text-white">
        <h2 className="text-lg font-bold mb-2">Selected Content:</h2>
        <div className="bg-gray-700 p-4 rounded-lg text-white w-94 h-32 overflow-auto">
          {/* Display the selected content with scrollable area for long messages */}
          {selectedContent ? (
            <div className="whitespace-pre-wrap break-words">{selectedContent}</div>
          ) : (
            'Click on a box to see details here.'
          )}
        </div>
      </div>
    </div>
  );
}
