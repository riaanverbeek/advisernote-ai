'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  date: string;
  transcript?: string;
  summary?: string;
}

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to fetch meetings from Supabase
        const mockMeetings: Meeting[] = [
          {
            id: '1',
            title: 'Team Standup',
            date: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Client Review',
            date: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setMeetings(mockMeetings);
      } catch (err) {
        setError('Failed to load meetings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Create new meeting entry
      const newMeeting: Meeting = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        date: new Date().toISOString(),
        transcript: data.text,
      };

      setMeetings([newMeeting, ...meetings]);
    } catch (err) {
      setUploadError('Failed to upload audio file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Meeting Notes</h1>
          <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload Audio'}
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {uploadError && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{uploadError}</div>
        )}

        {loading ? (
          <div>Loading meetings...</div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
            )}

            {meetings.length === 0 ? (
              <p className="text-gray-600">No meetings yet. Upload an audio file to get started.</p>
            ) : (
              <div className="grid gap-4">
                {meetings.map((meeting) => (
                  <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
                      <h2 className="text-xl font-semibold mb-2">{meeting.title}</h2>
                      <p className="text-gray-600">
                        {new Date(meeting.date).toLocaleDateString()}
                      </p>
                      {meeting.summary && (
                        <p className="text-gray-700 mt-2 line-clamp-2">{meeting.summary}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
