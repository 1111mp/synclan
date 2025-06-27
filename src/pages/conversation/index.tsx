import { Link } from 'react-router';
import { Layout } from './layout';

function ConversationPage() {
  return (
    <Layout>
      <Link to='/conversation/12345'>sss</Link>
    </Layout>
  );
}

export default ConversationPage;
