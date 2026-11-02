import React from 'react';
import { Layout } from '../components/Layout';
import { SEO } from '../components/SEO';
import ContactForm from '../components/contact/ContactForm';

export const Contact: React.FC = () => {
  return (
    <>
      <SEO
        title="Contact"
        description="Send Corey Smaller a note about music, writing, or a booking."
        url="https://coreysmaller.com/contact"
      />
      <Layout>
        <section className="container section first">
          <ContactForm />
        </section>
      </Layout>
    </>
  );
};
