    const fetch = require('node-fetch'); // Import fetch library for making HTTP requests
    const crypto = require('crypto');

    async function cancelDeliveryOnCrewExpress(deliveryId, accessToken) {
      if (!deliveryId || !accessToken) {
        console.error('Delivery ID and Access Token are required.');
        return;
      }
    
      const crewBaseUrl = 'https://api.staging.crewexp.com'; // Example base URL for CrewExpress API
    
      const cancelInfo = {
        delivery_request: {
          "id": deliveryId,
        },
      };
      try {
        const cancelResultOnCrew = await fetch(
          `${crewBaseUrl}/admin/api/v1/delivery_requests/canceleds`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(cancelInfo),
          },
        );
    
        // if (!cancelResultOnCrew.ok) {
        //   throw new Error(`Failed to cancel delivery on CrewExpress. Status: ${cancelResultOnCrew.status}`);
        // }
    
        // const cancelResultJson = await cancelResultOnCrew.json();
        console.log('++++++++++ cancelResultOnCrew: ++++++++++');
        console.log(cancelResultOnCrew); // Log the response
        console.log(cancelResultOnCrew.status); // Log the response
        console.log(cancelResultOnCrew.data); // Log the response
      } catch (error) {
        console.error('Error cancelling delivery on CrewExpress:', error.type);
      }
    }
    
    // Example usage with delivery ID and access token provided as command line arguments
    const deliveryId = 8158;
    const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InlTZTNXaFdpLVFNaWNkVnNpaGt0MCJ9.eyJpc3MiOiJodHRwczovL2NyZXctZXhwcmVzcy1zdGFnaW5nLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJqV2tFU0JaeHB2VjdwZkg3b2F0RE5BMWVCMHBJU2djQ0BjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9hcGkuc3RhZ2luZy5jcmV3ZXhwLmNvbS9hZG1pbi9hcGkiLCJpYXQiOjE3MTExNzI3MDUsImV4cCI6MTcxMTI1OTEwNSwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXpwIjoialdrRVNCWnhwdlY3cGZIN29hdEROQTFlQjBwSVNnY0MifQ.EY0jFPoGEEsb3Gx5W0Y7ehfrBIeX0VwGiE-QPgcWSxfiUOTBCWdnZbcw4uRpiF9-3kji4SrDLZXnWaTX52NVrMjbwWVTsp78K2o05rsMnuxpqcT4xygLU1tEzVWisl5llwVB545VX-1i4Nm01XiAtwHNc5Fj0aVMW6T9FrXXTgLpBrws5ItMzHYb3sAeohtVt-uArfrkzVIzcql64f550XRPDWbpJP2Hlq44RMJylxMD_gs-_NpIDHnGlJNz_InBV4l8guaKiVdu5kqbudxtvII4EJNnf8OqDgt4x6qmfyO6S9M8uWQPpf0TPkERXPUOjDIiHTUAcWGCzUOVAlQGgg"
    
    // cancelDeliveryOnCrewExpress(deliveryId, accessToken);
    
    


    function verifySignature(header, rawBody, crewExpressAcc) {
      // Step 1: Extract the timestamp and signatures from the header
      const elements = header.split(',');
      let timestamp, receivedSignature;
      for (const element of elements) {
        const [key, value] = element.split('=');
        if (key === 't') timestamp = parseInt(value);
        else if (key === 'v1') receivedSignature = value;
      }
    
      // Step 2: Prepare the signed_payload string
      const signedPayload = `${timestamp}.${rawBody}`;
    
      // Step 3: Determine the expected signature
      const expectedSignature = crypto
        .createHmac('sha256', crewExpressAcc.clientSecret)
        .update(signedPayload)
        .digest('hex');
    
      // Step 4: Compare the signatures
      const isEqual = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    
      // Calculate the timestamp difference 
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timestampDifference = currentTimestamp - timestamp;
      const maxTimestampDifference = 300; // Tolerance: 5 minutes (300 seconds)
    
      // Return the verification result
      return {
        verifyResult: isEqual,
        timestamp: currentTimestamp
      };
    }
    
    // Example usage:
    const header = "t=1710838672,v1=e6dcd7573c7f4a1523946660d434574069b0e6b965e50d7591a4ed7affdcd532"; // Example header
    const rawBody = '{"event_type":"onDeliveryRequestMatched","delivery_request_id":8142,"pick_up_event_time_prediction":{"event_type":"pick_up","original_prediction":"2024-03-19T18:07:42+09:00","latest_prediction":"2024-03-19T18:07:42+09:00"}}'; // Example raw body
    const crewExpressAcc = {
      clientSecret: "80a927e6-3837-4339-995d-ae909193383e" // Your client secret
    };
    
    const result = verifySignature(header, rawBody, crewExpressAcc);
    console.log(result);
