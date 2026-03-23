import { ReviewsList } from '@/components/dashboard/reviews-list'

export default function ReviewsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and respond to your Google reviews.
        </p>
      </div>
      <ReviewsList />
    </div>
  )
}
