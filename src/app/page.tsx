import Link from 'next/link';

export default function Home() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8'>
      <div className='max-w-2xl w-full space-y-8 text-center'>
        <div>
          <h1 className='text-4xl font-bold text-indigo-900 mb-3'>
            SimpleRead Medical
          </h1>
          <p className='text-lg text-indigo-700'>
            Upload medical documents and ask questions
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10'>
          <Link
            href='/upload'
            className='group bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-400 text-left'
          >
            <div className='text-4xl mb-4'>📄</div>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>
              Upload Documents
            </h2>
            <p className='text-gray-500 text-sm'>
              Add PDFs, Word docs, or text files to your medical knowledge base
            </p>
          </Link>

          <Link
            href='/chat'
            className='group bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-400 text-left'
          >
            <div className='text-4xl mb-4'>💬</div>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>
              Ask Questions
            </h2>
            <p className='text-gray-500 text-sm'>
              Chat with Claude 3.5 Sonnet about your uploaded medical documents
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
