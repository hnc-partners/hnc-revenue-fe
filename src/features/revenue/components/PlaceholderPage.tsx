/**
 * PlaceholderPage.tsx
 *
 * Reusable placeholder component for unimplemented pages.
 * Renders a card with the page name and "Coming soon" text.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@hnc-partners/ui-components';

interface PlaceholderPageProps {
  /** Page title displayed in the card */
  title: string;
  /** Optional description text */
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {description || 'Coming soon'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
