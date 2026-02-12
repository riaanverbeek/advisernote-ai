'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  date: string;
  transcript?: string;
  summary?: string;
}

export default function MeetingDetail() {
  const params = useParams();
  const meetingId = params?.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to fetch meeting from Supabase
        const mockMeeting: Meeting = {
          id: meetingId,
          title: 'Team Standup',
          date: new Date().toISOString(),
          transcript:
            'This is a sample transcript of the meeting. Team members discussed project updates and upcoming deadlines.',
        };
        setMeeting(mockMeeting);
      } catch (err) {
        setError('Failed to load meeting');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);

  const handleSummarize = async () => {
    if (!meeting?.transcript) return;

    try {
      setSummarizing(true);
      const response = await fetch('/api/summarise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: meeting.transcript }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize');
      }

      const data = await response.json();
      setMeeting({ ...meeting, summary: data.summary });
    } catch (err) {
      setError('Failed to summarize transcript');
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!meeting?.summary) return;

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: meeting.summary,
          title: meeting.title,
          date: meeting.date,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meeting.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading meeting...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!meeting) {
    return <div className="p-6">Meeting not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">{meeting.title}</h1>
        <p className="text-gray-600 mb-6">{new Date(meeting.date).toLocaleString()}</p>

        {meeting.transcript && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-2xl font-semibold mb-4">Transcript</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{meeting.transcript}</p>
          </div>
        )}

        {meeting.transcript && !meeting.summary && (
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mb-6"
          >
            {summarizing ? 'Summarizing...' : 'Generate Summary'}
          </button>
        )}

        {meeting.summary && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Summary</h2>
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Download PDF
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{meeting.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
